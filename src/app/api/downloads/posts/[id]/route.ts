import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPresignedDownloadUrl, MEDIA_BUCKET, MUSIC_BUCKET } from "@/lib/r2";
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
    const [post, siteSettings] = await Promise.all([
      db.post.findFirst({
        where: { id, status: "PUBLISHED" },
        select: {
          id: true,
          title: true,
          enableDownload: true,
          downloadMedia: {
            select: {
              id: true,
              r2Key: true,
              filename: true,
              type: true,
            },
          },
        },
      }),
      db.siteSettings.findUnique({
        where: { id: "default" },
        select: { enableDownloads: true, maxDownloadsPerHour: true },
      }),
    ]);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (siteSettings && !siteSettings.enableDownloads) {
      return NextResponse.json({ error: "Downloads are currently disabled" }, { status: 403 });
    }

    if (!post.enableDownload || !post.downloadMedia) {
      return NextResponse.json(
        { error: "No downloadable file attached to this post" },
        { status: 403 }
      );
    }

    if (post.downloadMedia.type !== "AUDIO" && post.downloadMedia.type !== "DOCUMENT") {
      return NextResponse.json({ error: "Unsupported attachment type" }, { status: 400 });
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

    const bucket = post.downloadMedia.type === "AUDIO" ? MUSIC_BUCKET : MEDIA_BUCKET;
    const url = await getPresignedDownloadUrl(
      bucket,
      post.downloadMedia.r2Key,
      post.downloadMedia.filename
    );

    db.post
      .update({
        where: { id: post.id },
        data: { downloadCount: { increment: 1 } },
      })
      .catch(() => {});
    trackInteractionEvent({
      eventName: RecommendationEventName.POST_DOWNLOAD,
      entityType: RecommendationEntityType.POST,
      entityId: post.id,
      userId,
      surface: RecommendationSurface.POST_DETAIL,
      weightHint: 8,
      metadata: { mediaType: post.downloadMedia.type },
    });

    return NextResponse.json({
      url,
      filename: post.downloadMedia.filename,
      title: post.title,
    });
  } catch (err) {
    console.error(`[POST /api/downloads/posts/${id}]`, err);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
