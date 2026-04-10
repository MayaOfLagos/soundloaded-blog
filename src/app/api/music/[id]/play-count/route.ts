import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";

// Increment stream count — called client-side after 30s of actual playback
// IP-deduped: one count per IP per track per 5 minutes
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  try {
    // De-duplicate via Redis (one play per IP per track per 5 min)
    const redisKey = `sl:playcount:${id}:${ip}`;
    try {
      const isNew = await redis.set(redisKey, "1", { nx: true, ex: 300 });
      if (!isNew) {
        return NextResponse.json({ ok: true, duplicate: true });
      }
    } catch {
      // Redis unavailable — reject to prevent abuse (fail-closed)
      return NextResponse.json({ ok: true, skipped: true });
    }

    await db.music.update({
      where: { id },
      data: { streamCount: { increment: 1 } },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
