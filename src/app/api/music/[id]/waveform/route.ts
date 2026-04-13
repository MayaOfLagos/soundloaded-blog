import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/music/[id]/waveform
 * Public endpoint to fetch waveform data for a track.
 * Returns the pre-computed waveform peaks array.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const music = await db.music.findUnique({
      where: { id },
      select: {
        waveformData: true,
        duration: true,
        processingStatus: true,
      },
    });

    if (!music) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!music.waveformData || music.processingStatus !== "completed") {
      return NextResponse.json({ peaks: null, status: music.processingStatus }, { status: 200 });
    }

    return NextResponse.json(
      { peaks: music.waveformData, duration: music.duration },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      }
    );
  } catch {
    return NextResponse.json({ error: "Failed to fetch waveform" }, { status: 500 });
  }
}
