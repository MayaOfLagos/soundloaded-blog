import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Only instantiate rate limiters when Upstash env vars are present
const hasUpstash = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const downloadLimit = hasUpstash
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, "1 h"),
      analytics: false,
      prefix: "sl_download",
    })
  : null;

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
      limiter: Ratelimit.slidingWindow(60, "1 m"),
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

  // Rate limit music downloads (10/hr per IP)
  if (pathname.match(/^\/api\/music\/[^/]+\/download/) && downloadLimit) {
    const { success, limit, remaining, reset } = await downloadLimit.limit(ip);
    if (!success) {
      return new NextResponse(
        JSON.stringify({ error: "Download limit reached. Try again later." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
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

  // General API rate limit (60 req/min per IP — public API only)
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/admin") && apiLimit) {
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
  matcher: ["/api/music/:path*/download", "/api/music/:path*/stream", "/api/:path*"],
};
