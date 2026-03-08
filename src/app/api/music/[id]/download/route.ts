import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getPresignedDownloadUrl, MUSIC_BUCKET } from "@/lib/r2";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasUpstash = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

function getDownloadRatelimit(maxDownloadsPerHour: number) {
  if (!hasUpstash) return null;
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(maxDownloadsPerHour, "1 h"),
    prefix: "soundloadedblog:download",
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  try {
    const [music, siteSettings] = await Promise.all([
      db.music.findUnique({
        where: { id },
        select: {
          id: true,
          r2Key: true,
          filename: true,
          enableDownload: true,
          isExclusive: true,
          price: true,
        },
      }),
      db.siteSettings.findUnique({
        where: { id: "default" },
        select: { enableDownloads: true, maxDownloadsPerHour: true },
      }),
    ]);

    if (!music) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    if (siteSettings && !siteSettings.enableDownloads) {
      return NextResponse.json({ error: "Downloads are currently disabled" }, { status: 403 });
    }

    if (!music.enableDownload) {
      return NextResponse.json({ error: "Downloads are disabled for this track" }, { status: 403 });
    }

    // Premium gating for exclusive tracks
    if (music.isExclusive) {
      const session = await auth();
      if (!session?.user) {
        return NextResponse.json(
          { error: "Premium content", requiresAuth: true, price: music.price },
          { status: 402 }
        );
      }

      const userId = (session.user as { id: string }).id;
      const subscription = await db.subscription.findUnique({
        where: { userId },
        select: { status: true, currentPeriodEnd: true },
      });

      const hasActiveSub =
        subscription?.status === "ACTIVE" &&
        subscription.currentPeriodEnd &&
        subscription.currentPeriodEnd > new Date();

      if (!hasActiveSub) {
        const purchase = await db.transaction.findFirst({
          where: { userId, musicId: id, type: "download", status: "success" },
        });

        if (!purchase) {
          return NextResponse.json(
            { error: "Premium content", requiresPurchase: true, price: music.price },
            { status: 402 }
          );
        }
      }
    }

    const maxDownloadsPerHour = siteSettings?.maxDownloadsPerHour ?? 10;
    const ratelimit = getDownloadRatelimit(maxDownloadsPerHour);
    if (ratelimit) {
      const { success, limit, remaining, reset } = await ratelimit.limit(ip);
      if (!success) {
        return NextResponse.json(
          { error: "Download limit reached. Try again later." },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": limit.toString(),
              "X-RateLimit-Remaining": remaining.toString(),
              "X-RateLimit-Reset": new Date(reset).toISOString(),
            },
          }
        );
      }
    }

    // Generate signed download URL (5 min expiry)
    const url = await getPresignedDownloadUrl(MUSIC_BUCKET, music.r2Key, music.filename);

    // Track download in DB (fire-and-forget)
    Promise.all([
      db.music.update({ where: { id }, data: { downloadCount: { increment: 1 } } }),
      db.download.create({
        data: {
          musicId: id,
          ip,
          userAgent: req.headers.get("user-agent") ?? undefined,
        },
      }),
    ]).catch(() => {});

    return NextResponse.json({ url, filename: music.filename });
  } catch (err) {
    console.error(`[POST /api/music/${id}/download]`, err);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
