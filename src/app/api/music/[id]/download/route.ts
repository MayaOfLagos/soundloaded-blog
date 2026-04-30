import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getMusicAccess,
  musicAccessDeniedResponse,
  trackMusicAccessDenied,
} from "@/lib/music-access";
import { getPresignedDownloadUrl, MUSIC_BUCKET } from "@/lib/r2";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import {
  RecommendationEntityType,
  RecommendationEventName,
  RecommendationSurface,
} from "@prisma/client";
import { trackInteractionEvent } from "@/lib/recommendation";

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
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  try {
    const access = await getMusicAccess({ musicId: id, userId, intent: "download" });
    if (!access.allowed) {
      trackMusicAccessDenied({
        result: access,
        userId,
        surface: RecommendationSurface.MUSIC_DETAIL,
        placement: "download",
      });
      return musicAccessDeniedResponse(access);
    }

    const music = access.music!;
    const maxDownloadsPerHour = access.siteSettings?.maxDownloadsPerHour ?? 10;
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
          userId,
          ip,
          userAgent: req.headers.get("user-agent") ?? undefined,
        },
      }),
    ]).catch(() => {});
    trackInteractionEvent({
      eventName: RecommendationEventName.MUSIC_DOWNLOAD,
      entityType: RecommendationEntityType.MUSIC,
      entityId: id,
      userId,
      surface: RecommendationSurface.MUSIC_DETAIL,
      artistId: music.artistId,
      albumId: music.albumId,
      genre: music.genre,
      weightHint: 10,
      metadata: {
        isExclusive: music.isExclusive,
        accessModel: music.accessModel,
        streamAccess: music.streamAccess,
        hasActiveSubscription: access.hasActiveSubscription,
        hasPurchase: access.hasPurchase,
      },
    });

    return NextResponse.json({ url, filename: music.filename });
  } catch (err) {
    console.error(`[POST /api/music/${id}/download]`, err);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
