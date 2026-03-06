import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const SETTINGS_ROLES = ["ADMIN", "SUPER_ADMIN"];

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role ?? "";
  if (!session || !SETTINGS_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    database: !!process.env.DATABASE_URL,
    authSecret: !!(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET),
    cloudflareR2: !!(
      process.env.CLOUDFLARE_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY
    ),
    r2MediaBucket: !!process.env.R2_MEDIA_BUCKET,
    r2MusicBucket: !!process.env.R2_MUSIC_BUCKET,
    resendApiKey: !!process.env.RESEND_API_KEY,
    meilisearch: !!(process.env.MEILI_HOST && process.env.MEILI_MASTER_KEY),
    sentryDsn: !!process.env.SENTRY_DSN,
    upstashRedis: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
    vercelAnalytics: !!process.env.VERCEL_ANALYTICS_ID,
    umamiAnalytics: !!process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
    cdnUrl: !!process.env.NEXT_PUBLIC_CDN_URL,
    musicCdnUrl: !!process.env.NEXT_PUBLIC_MUSIC_CDN_URL,
  });
}
