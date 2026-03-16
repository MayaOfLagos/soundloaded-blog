import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { indexMusic, removeFromIndex, INDEXES } from "@/lib/meilisearch";
import { z } from "zod";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "EDITOR"];

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role ?? "";
  if (!session || !ADMIN_ROLES.includes(role)) return null;
  return session;
}

const updateSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  artistId: z.string().min(1),
  albumId: z.string().optional().nullable(),
  genre: z.string().optional().nullable(),
  year: z.number().int().optional().nullable(),
  format: z.string().default("mp3"),
  duration: z.number().int().optional().nullable(),
  bitrate: z.number().int().optional().nullable(),
  trackNumber: z.number().int().optional().nullable(),
  coverArt: z.string().optional().nullable(),
  label: z.string().optional().nullable(),
  isExclusive: z.boolean().default(false),
  price: z.number().int().min(0).optional().nullable(),
  enableDownload: z.boolean().default(true),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const music = await db.music.findUnique({
    where: { id },
    include: {
      artist: { select: { id: true, name: true, slug: true } },
      album: { select: { id: true, title: true, slug: true } },
    },
  });

  if (!music) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...music, fileSize: music.fileSize.toString() });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const music = await db.music.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        artistId: data.artistId,
        albumId: data.albumId ?? null,
        genre: data.genre ?? null,
        year: data.year ?? null,
        format: data.format,
        duration: data.duration ?? null,
        bitrate: data.bitrate ?? null,
        trackNumber: data.trackNumber ?? null,
        coverArt: data.coverArt ?? null,
        label: data.label ?? null,
        isExclusive: data.isExclusive,
        price: data.price ?? null,
        enableDownload: data.enableDownload,
      },
      include: {
        artist: { select: { name: true, slug: true } },
        album: { select: { title: true, slug: true } },
      },
    });

    // Update companion post title
    await db.post.update({
      where: { id: music.postId },
      data: { title: data.title, slug: data.slug },
    });

    indexMusic(music);
    return NextResponse.json({ ...music, fileSize: music.fileSize.toString() });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 422 });
    console.error("[PUT /api/admin/music]", err);
    return NextResponse.json({ error: "Failed to update music" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const music = await db.music.findUnique({ where: { id }, select: { id: true, postId: true } });
  if (!music) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete music record then archive companion post
  await db.music.delete({ where: { id } });
  await db.post.update({ where: { id: music.postId }, data: { status: "ARCHIVED" } });

  removeFromIndex(INDEXES.MUSIC, id);
  return NextResponse.json({ deleted: true });
}
