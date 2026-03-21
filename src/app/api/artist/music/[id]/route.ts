import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { indexMusic, removeFromIndex, INDEXES } from "@/lib/meilisearch";
import { z } from "zod";

const updateTrackSchema = z.object({
  title: z.string().min(2).optional(),
  genre: z.string().optional().nullable(),
  year: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
  coverArt: z.string().url().optional().nullable().or(z.literal("")),
  label: z.string().optional().nullable(),
  trackNumber: z.coerce.number().int().positive().optional().nullable(),
  albumId: z.string().optional().nullable(),
  isExclusive: z.boolean().optional(),
  enableDownload: z.boolean().optional(),
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
  const track = await db.music.findUnique({
    where: { id, artistId: result.artistProfileId },
    include: { album: { select: { id: true, title: true } } },
  });

  if (!track) return NextResponse.json({ error: "Track not found" }, { status: 404 });
  return NextResponse.json({ ...track, fileSize: track.fileSize.toString() });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireArtist();
  if (!result) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const data = updateTrackSchema.parse(body);

    // Verify ownership
    const existing = await db.music.findUnique({
      where: { id, artistId: result.artistProfileId },
    });
    if (!existing) return NextResponse.json({ error: "Track not found" }, { status: 404 });

    const track = await db.music.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.genre !== undefined && { genre: data.genre }),
        ...(data.year !== undefined && { year: data.year }),
        ...(data.coverArt !== undefined && { coverArt: data.coverArt || null }),
        ...(data.label !== undefined && { label: data.label }),
        ...(data.trackNumber !== undefined && { trackNumber: data.trackNumber }),
        ...(data.albumId !== undefined && { albumId: data.albumId || null }),
        ...(data.isExclusive !== undefined && { isExclusive: data.isExclusive }),
        ...(data.enableDownload !== undefined && { enableDownload: data.enableDownload }),
      },
    });

    // Update companion post title if changed
    if (data.title) {
      await db.post.update({
        where: { id: existing.postId },
        data: { title: data.title },
      });
    }

    indexMusic(track);
    return NextResponse.json({ ...track, fileSize: track.fileSize.toString() });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 422 });
    console.error("[PUT /api/artist/music/[id]]", err);
    return NextResponse.json({ error: "Failed to update track" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireArtist();
  if (!result) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const track = await db.music.findUnique({
    where: { id, artistId: result.artistProfileId },
  });
  if (!track) return NextResponse.json({ error: "Track not found" }, { status: 404 });

  await db.$transaction(async (tx) => {
    await tx.music.delete({ where: { id } });
    await tx.post.update({ where: { id: track.postId }, data: { status: "ARCHIVED" } });
  });

  removeFromIndex(INDEXES.MUSIC, id);
  return NextResponse.json({ deleted: true });
}
