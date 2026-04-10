import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updatePlaylistSchema } from "@/lib/validations/user";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const playlist = await db.playlist.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, username: true, image: true } },
      tracks: {
        orderBy: { position: "asc" },
        include: {
          music: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverArt: true,
              duration: true,
              genre: true,
              streamCount: true,
              downloadCount: true,
              enableDownload: true,
              artist: { select: { name: true, slug: true } },
              album: { select: { title: true, slug: true } },
            },
          },
        },
      },
    },
  });

  if (!playlist) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  // Only the owner or public playlists
  if (playlist.userId !== userId && !playlist.isPublic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ playlist, isOwner: playlist.userId === userId });
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
  const parsed = updatePlaylistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await db.playlist.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ playlist: updated });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
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

  await db.playlist.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
