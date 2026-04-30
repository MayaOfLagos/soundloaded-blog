import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const playlist = await db.playlist.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, username: true, image: true } },
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
              r2Key: true,
              streamCount: true,
              downloadCount: true,
              enableDownload: true,
              isExclusive: true,
              price: true,
              accessModel: true,
              streamAccess: true,
              creatorPrice: true,
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

  // Check access: public or owner
  const session = await auth();
  const userId = (session?.user as { id: string } | undefined)?.id;
  const isOwner = userId === playlist.userId;

  if (!playlist.isPublic && !isOwner) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ playlist, isOwner });
}
