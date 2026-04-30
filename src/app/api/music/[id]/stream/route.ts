import { NextRequest, NextResponse } from "next/server";
import { RecommendationSurface } from "@prisma/client";
import { auth } from "@/lib/auth";
import {
  getMusicAccess,
  musicAccessDeniedResponse,
  trackMusicAccessDenied,
} from "@/lib/music-access";
import { getPresignedStreamUrl, MUSIC_BUCKET } from "@/lib/r2";

// Stream endpoint: redirects to a short-lived signed R2 URL
// Prefers the processed (transcoded/normalized) version when available
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  try {
    const access = await getMusicAccess({ musicId: id, userId, intent: "stream" });
    if (!access.allowed) {
      trackMusicAccessDenied({
        result: access,
        userId,
        surface: RecommendationSurface.MUSIC_DETAIL,
        placement: "stream",
      });
      return musicAccessDeniedResponse(access);
    }

    const music = access.music!;

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
