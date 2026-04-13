import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPresignedStreamUrl, MUSIC_BUCKET } from "@/lib/r2";

// Stream endpoint: redirects to a short-lived signed R2 URL
// Prefers the processed (transcoded/normalized) version when available
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const music = await db.music.findUnique({
      where: { id },
      select: { r2Key: true, processedR2Key: true, processingStatus: true },
    });
    if (!music) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!music.r2Key)
      return NextResponse.json({ error: "No audio file available" }, { status: 404 });

    // Use processed version if available, otherwise fall back to original
    const streamKey =
      music.processingStatus === "completed" && music.processedR2Key
        ? music.processedR2Key
        : music.r2Key;

    const url = await getPresignedStreamUrl(MUSIC_BUCKET, streamKey);

    // Stream count is now incremented client-side after 30s of actual playback
    // via /api/music/[id]/play-count endpoint

    return NextResponse.redirect(url);
  } catch {
    return NextResponse.json({ error: "Stream failed" }, { status: 500 });
  }
}
