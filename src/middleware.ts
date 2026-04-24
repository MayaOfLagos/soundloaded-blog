import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getToken } from "next-auth/jwt";

// Roles that are allowed to access /admin routes
const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN", "EDITOR"]);
const authSecret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;

// Only instantiate rate limiters when Upstash env vars are present
const hasUpstash = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const streamLimit = hasUpstash
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(20, "1 h"),
      analytics: false,
      prefix: "sl_stream",
    })
  : null;

const apiLimit = hasUpstash
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(120, "1 m"),
      analytics: false,
      prefix: "sl_api",
    })
  : null;

// Admin API rate limit (60 req/min per IP — prevents rapid abuse with compromised credentials)
const adminApiLimit = hasUpstash
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      analytics: false,
      prefix: "sl_admin_api",
    })
  : null;

// Sensitive auth route rate limit (5 req/15min per IP — forgot-password, reset-password, check-lockout)
const authSensitiveLimit = hasUpstash
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      analytics: false,
      prefix: "sl_auth_sensitive",
    })
  : null;

function getIP(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}

function usesSecureAuthCookies(req: NextRequest): boolean {
  const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0].trim();
  return req.nextUrl.protocol === "https:" || forwardedProto === "https";
}

function logAdminAuthFailure(
  req: NextRequest,
  reason: "missing-token" | "insufficient-role",
  role: string,
  secureCookie: boolean
) {
  console.warn("[admin-auth] denied", {
    reason,
    pathname: req.nextUrl.pathname,
    role,
    host: req.headers.get("host"),
    secureCookie,
  });
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = getIP(req);

  // ── Admin route protection ────────────────────────────────────────
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const secureCookie = usesSecureAuthCookies(req);
    const token = await getToken({
      req,
      secret: authSecret,
      secureCookie,
    });
    const role = (token?.role as string) ?? "";

    if (pathname.startsWith("/api/admin")) {
      // API routes return JSON errors
      if (!token) {
        logAdminAuthFailure(req, "missing-token", role, secureCookie);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (!ADMIN_ROLES.has(role)) {
        logAdminAuthFailure(req, "insufficient-role", role, secureCookie);
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // ── CSRF protection for mutating requests ─────────────────────
      const method = req.method.toUpperCase();
      if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
        const origin = req.headers.get("origin");
        const referer = req.headers.get("referer");
        const host = req.headers.get("host") ?? "";
        const allowedOrigin = `${req.nextUrl.protocol}//${host}`;

        const originOk =
          (origin && origin === allowedOrigin) || (referer && referer.startsWith(allowedOrigin));

        if (!originOk) {
          return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
        }
      }

      // ── Admin API rate limiting ───────────────────────────────────
      if (adminApiLimit) {
        const { success } = await adminApiLimit.limit(ip);
        if (!success) {
          return NextResponse.json(
            { error: "Too many admin requests. Slow down." },
            { status: 429 }
          );
        }
      }
    } else {
      // Page routes redirect to login
      if (!token || !ADMIN_ROLES.has(role)) {
        logAdminAuthFailure(req, token ? "insufficient-role" : "missing-token", role, secureCookie);
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  // ── Maintenance mode ──────────────────────────────────────────────
  // Skip maintenance check for admin, API, auth, and static paths
  const skipMaintenance =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/maintenance") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons");

  if (!skipMaintenance) {
    try {
      const baseUrl = req.nextUrl.origin;
      const res = await fetch(`${baseUrl}/api/settings`, {
        headers: { "x-internal": "1" },
      });
      if (res.ok) {
        const settings = await res.json();
        if (settings.maintenanceMode) {
          return NextResponse.rewrite(new URL("/maintenance", req.url));
        }
      }
    } catch {
      // If settings fetch fails, don't block the site
    }
  }

  // ── Rate-limit sensitive auth endpoints (5 req/15min per IP) ────
  const sensitiveAuthPaths = [
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
    "/api/auth/check-lockout",
    "/api/user/password",
    "/api/user/delete-account",
  ];
  if (sensitiveAuthPaths.includes(pathname) && authSensitiveLimit) {
    const { success } = await authSensitiveLimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }
  }

  // Rate limit music streams (20/hr per IP)
  if (pathname.match(/^\/api\/music\/[^/]+\/stream/) && streamLimit) {
    const { success, limit, remaining, reset } = await streamLimit.limit(ip);
    if (!success) {
      return new NextResponse(JSON.stringify({ error: "Stream limit reached. Try again later." }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
          "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      });
    }
  }

  // General API rate limit (120 req/min per IP — public API only, excludes user-specific endpoints)
  if (
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/admin") &&
    !pathname.startsWith("/api/user/") &&
    !pathname.startsWith("/api/auth/") &&
    apiLimit
  ) {
    const { success } = await apiLimit.limit(ip);
    if (!success) {
      return new NextResponse(JSON.stringify({ error: "Too many requests. Slow down." }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons).*)"],
};
