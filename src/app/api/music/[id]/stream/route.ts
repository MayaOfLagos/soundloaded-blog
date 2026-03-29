import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPresignedDownloadUrl, MUSIC_BUCKET } from "@/lib/r2";

// Stream endpoint: redirects to a short-lived signed R2 URL
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const music = await db.music.findUnique({
      where: { id },
      select: { r2Key: true, filename: true },
    });
    if (!music) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!music.r2Key)
      return NextResponse.json({ error: "No audio file available" }, { status: 404 });

    const url = await getPresignedDownloadUrl(MUSIC_BUCKET, music.r2Key, music.filename);

    // Increment stream count only after successful URL generation
    db.music.update({ where: { id }, data: { streamCount: { increment: 1 } } }).catch(() => {});

    return NextResponse.redirect(url);
  } catch {
    return NextResponse.json({ error: "Stream failed" }, { status: 500 });
  }
}
