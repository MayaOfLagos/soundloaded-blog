import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { addTrackToPlaylistSchema, reorderPlaylistSchema } from "@/lib/validations/user";
import { Prisma } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const playlist = await db.playlist.findUnique({ where: { id } });
  if (!playlist || playlist.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = addTrackToPlaylistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Get next position
  const lastTrack = await db.playlistTrack.findFirst({
    where: { playlistId: id },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const nextPosition = (lastTrack?.position ?? -1) + 1;

  try {
    const track = await db.playlistTrack.create({
      data: {
        playlistId: id,
        musicId: parsed.data.musicId,
        position: nextPosition,
      },
    });

    // Touch playlist updatedAt
    await db.playlist.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ track }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Track already in playlist" }, { status: 409 });
    }
    throw error;
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const playlist = await db.playlist.findUnique({ where: { id } });
  if (!playlist || playlist.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = reorderPlaylistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Batch update positions in a transaction
  await db.$transaction(
    parsed.data.tracks.map((t) =>
      db.playlistTrack.update({
        where: { id: t.id, playlistId: id },
        data: { position: t.position },
      })
    )
  );

  return NextResponse.json({ success: true });
}
