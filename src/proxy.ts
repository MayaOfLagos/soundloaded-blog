import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

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

function getIP(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = getIP(req);

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
