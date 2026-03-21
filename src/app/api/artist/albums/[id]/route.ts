import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateAlbumSchema = z.object({
  title: z.string().min(1).optional(),
  coverArt: z.string().url().optional().nullable().or(z.literal("")),
  releaseDate: z.string().optional().nullable(),
  type: z.enum(["ALBUM", "EP", "MIXTAPE", "COMPILATION"]).optional(),
  genre: z.string().optional().nullable(),
  label: z.string().optional().nullable(),
});

async function requireArtist() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const artistProfileId = (session.user as { artistProfileId?: string | null }).artistProfileId;
  if (!artistProfileId) return null;
  return { session, artistProfileId };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireArtist();
  if (!result) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const album = await db.album.findUnique({
    where: { id, artistId: result.artistProfileId },
    include: { _count: { select: { tracks: true } } },
  });

  if (!album) return NextResponse.json({ error: "Album not found" }, { status: 404 });
  return NextResponse.json(album);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireArtist();
  if (!result) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const data = updateAlbumSchema.parse(body);

    const existing = await db.album.findUnique({
      where: { id, artistId: result.artistProfileId },
    });
    if (!existing) return NextResponse.json({ error: "Album not found" }, { status: 404 });

    const album = await db.album.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.coverArt !== undefined && { coverArt: data.coverArt || null }),
        ...(data.releaseDate !== undefined && {
          releaseDate: data.releaseDate ? new Date(data.releaseDate) : null,
        }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.genre !== undefined && { genre: data.genre }),
        ...(data.label !== undefined && { label: data.label }),
      },
    });

    return NextResponse.json(album);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 422 });
    console.error("[PUT /api/artist/albums/[id]]", err);
    return NextResponse.json({ error: "Failed to update album" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireArtist();
  if (!result) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const album = await db.album.findUnique({
    where: { id, artistId: result.artistProfileId },
    include: { _count: { select: { tracks: true } } },
  });

  if (!album) return NextResponse.json({ error: "Album not found" }, { status: 404 });

  if (album._count.tracks > 0) {
    return NextResponse.json(
      { error: `Cannot delete album with ${album._count.tracks} track(s). Remove tracks first.` },
      { status: 409 }
    );
  }

  await db.album.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
