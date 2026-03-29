import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string; trackId: string }>;
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id, trackId } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const playlist = await db.playlist.findUnique({ where: { id } });
  if (!playlist || playlist.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const track = await db.playlistTrack.findFirst({
    where: { id: trackId, playlistId: id },
  });

  if (!track) {
    return NextResponse.json({ error: "Track not found in playlist" }, { status: 404 });
  }

  await db.playlistTrack.delete({ where: { id: trackId } });

  // Recalculate positions for remaining tracks
  const remaining = await db.playlistTrack.findMany({
    where: { playlistId: id },
    orderBy: { position: "asc" },
    select: { id: true },
  });

  if (remaining.length > 0) {
    await db.$transaction(
      remaining.map((t, i) =>
        db.playlistTrack.update({
          where: { id: t.id },
          data: { position: i },
        })
      )
    );
  }

  return NextResponse.json({ success: true });
}
