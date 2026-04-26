import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getToken } from "next-auth/jwt";

// ── Constants ─────────────────────────────────────────────────────────────────
const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN", "EDITOR"]);
const authSecret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;

// Internal route that the admin login page actually lives at.
// Lives under /login/ so ConditionalNavigation already excludes it from public nav.
// Direct access always returns 404 — only reachable via middleware rewrite.
const ADMIN_GATEWAY_INTERNAL = "/login/admin-portal";

// Public-facing admin login URL — admin sets this in env (ADMIN_LOGIN_PATH).
const ADMIN_LOGIN_PATH = process.env.ADMIN_LOGIN_PATH ?? "";

// Secret that proves a request came from our middleware rewrite, not a browser.
const ADMIN_PORTAL_SECRET = process.env.ADMIN_PORTAL_SECRET ?? "";

// ── WAF: user-agents blocked on the admin portal ─────────────────────────────
const BLOCKED_UA_FRAGMENTS = [
  "sqlmap",
  "nikto",
  "nmap",
  "masscan",
  "zgrab",
  "nuclei",
  "dirbuster",
  "gobuster",
  "hydra",
  "medusa",
  "nessus",
  "openvas",
  "acunetix",
  "burpsuite",
  "metasploit",
  "python-requests/",
  "go-http-client/1.",
  "curl/",
  "wget/",
  "scrapy/",
  "semrushbot",
  "ahrefsbot",
  "mj12bot",
  "dotbot",
  "petalbot",
  "yandexbot",
];

function isBlockedUA(ua: string): boolean {
  if (!ua || ua.length < 10) return true; // missing / suspiciously short UA
  const lower = ua.toLowerCase();
  return BLOCKED_UA_FRAGMENTS.some((fragment) => lower.includes(fragment));
}

// ── IP whitelist — empty means allow everyone ─────────────────────────────────
function isIPAllowed(ip: string): boolean {
  const raw = process.env.ADMIN_IP_WHITELIST ?? "";
  if (!raw.trim()) return true;
  const whitelist = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return whitelist.includes(ip);
}

// ── Rate limiters ─────────────────────────────────────────────────────────────
const hasUpstash = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

function makeLimit(
  count: number,
  window: Parameters<typeof Ratelimit.slidingWindow>[1],
  prefix: string
) {
  if (!hasUpstash) return null;
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(count, window),
    analytics: false,
    prefix,
  });
}

// Admin portal: 5 page-loads per IP per 15 min — brute-force discovery protection
const adminPortalLimit = makeLimit(5, "15 m", "sl_admin_portal");
// Admin API: 60 req/min per IP
const adminApiLimit = makeLimit(60, "1 m", "sl_admin_api");
// Music streams: 20/hr per IP
const streamLimit = makeLimit(20, "1 h", "sl_stream");
// General public API: 120 req/min per IP
const apiLimit = makeLimit(120, "1 m", "sl_api");
// Sensitive auth (forgot-password, reset, check-lockout): 5 req/15 min per IP
const authSensitiveLimit = makeLimit(5, "15 m", "sl_auth_sensitive");

// ── Helpers ───────────────────────────────────────────────────────────────────
function getIP(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}

function usesSecureAuthCookies(req: NextRequest): boolean {
  const proto = req.headers.get("x-forwarded-proto")?.split(",")[0].trim();
  return req.nextUrl.protocol === "https:" || proto === "https";
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

// ── Middleware ────────────────────────────────────────────────────────────────
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = getIP(req);

  // ── 1. Block direct access to the internal gateway route ──────────────────
  // This path is only served through the rewrite in step 2 below.
  // The path lives under /login/ to inherit ConditionalNavigation exclusion,
  // but direct access is always rejected — only ADMIN_LOGIN_PATH rewrites reach it.
  if (pathname === ADMIN_GATEWAY_INTERNAL) {
    return new NextResponse(null, { status: 404 });
  }

  // ── 2. Admin portal entry point ────────────────────────────────────────────
  // ADMIN_LOGIN_PATH is the secret URL that admins use to reach the login page.
  if (ADMIN_LOGIN_PATH && pathname === ADMIN_LOGIN_PATH) {
    // WAF: reject known attack tools and scrapers
    const ua = req.headers.get("user-agent") ?? "";
    if (isBlockedUA(ua)) return new NextResponse(null, { status: 404 });

    // IP whitelist (if configured, only listed IPs see the login form)
    if (!isIPAllowed(ip)) return new NextResponse(null, { status: 404 });

    // Per-IP rate limit — 5 attempts per 15 min
    if (adminPortalLimit) {
      const { success } = await adminPortalLimit.limit(ip);
      // Return 404 so scrapers never learn whether the path exists
      if (!success) return new NextResponse(null, { status: 404 });
    }

    // Already-authenticated admins skip the form and go straight to the dashboard
    const secureCookie = usesSecureAuthCookies(req);
    const token = await getToken({ req, secret: authSecret, secureCookie });
    if (token && ADMIN_ROLES.has((token.role as string) ?? "")) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    // All checks passed — rewrite to the internal gateway page.
    // The portal secret is injected as a request header so the server component
    // can verify the request came through here (not directly from a browser).
    const reqHeaders = new Headers(req.headers);
    reqHeaders.set("x-admin-gateway-origin", ADMIN_PORTAL_SECRET);
    return NextResponse.rewrite(new URL(ADMIN_GATEWAY_INTERNAL, req.url), {
      request: { headers: reqHeaders },
    });
  }

  // ── 3. Admin route protection ──────────────────────────────────────────────
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const secureCookie = usesSecureAuthCookies(req);
    const token = await getToken({ req, secret: authSecret, secureCookie });
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

      // CSRF: reject cross-origin mutating requests
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

      // Admin API rate limit
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
      // Page routes: redirect unauthenticated requests to the admin portal
      if (!token || !ADMIN_ROLES.has(role)) {
        logAdminAuthFailure(req, token ? "insufficient-role" : "missing-token", role, secureCookie);
        const dest = ADMIN_LOGIN_PATH || "/login";
        const loginUrl = new URL(dest, req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  // ── 4. Maintenance mode ────────────────────────────────────────────────────
  const skipMaintenance =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/maintenance") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    (ADMIN_LOGIN_PATH !== "" && pathname === ADMIN_LOGIN_PATH);

  if (!skipMaintenance) {
    try {
      const res = await fetch(`${req.nextUrl.origin}/api/settings`, {
        headers: { "x-internal": "1" },
      });
      if (res.ok) {
        const settings = (await res.json()) as { maintenanceMode?: boolean };
        if (settings.maintenanceMode) {
          return NextResponse.rewrite(new URL("/maintenance", req.url));
        }
      }
    } catch {
      // Settings fetch failure must never block the site
    }
  }

  // ── 5. Sensitive auth route rate limiting ─────────────────────────────────
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

  // ── 6. Music stream rate limiting ─────────────────────────────────────────
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

  // ── 7. General public API rate limiting ───────────────────────────────────
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
