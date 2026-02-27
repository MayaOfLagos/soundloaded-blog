import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPresignedDownloadUrl, MUSIC_BUCKET } from "@/lib/r2";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Rate limit: 10 downloads per hour per IP
const ratelimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(10, "1 h"),
        prefix: "soundloadedblog:download",
      })
    : null;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // Rate limiting
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

  try {
    const music = await db.music.findUnique({ where: { id } });

    if (!music) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
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
