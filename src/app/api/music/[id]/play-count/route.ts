import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Increment stream count — called client-side after 30s of actual playback
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await db.music.update({
      where: { id },
      data: { streamCount: { increment: 1 } },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
