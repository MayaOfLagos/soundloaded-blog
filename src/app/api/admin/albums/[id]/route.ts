import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { albumSchema } from "@/lib/validations/album";
import { z } from "zod";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "EDITOR"];

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role ?? "";
  if (!session || !ADMIN_ROLES.includes(role)) return null;
  return session;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const album = await db.album.findUnique({
    where: { id },
    include: {
      artist: { select: { id: true, name: true } },
      _count: { select: { tracks: true } },
    },
  });

  if (!album) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(album);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const data = albumSchema.parse(body);

    const album = await db.album.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        artistId: data.artistId,
        coverArt: data.coverArt || null,
        releaseDate: data.releaseDate ? new Date(data.releaseDate) : null,
        type: data.type,
        genre: data.genre ?? null,
        label: data.label ?? null,
      },
      include: {
        artist: { select: { name: true, slug: true } },
      },
    });

    return NextResponse.json(album);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 422 });
    console.error("[PUT /api/admin/albums]", err);
    return NextResponse.json({ error: "Failed to update album" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const album = await db.album.findUnique({
    where: { id },
    include: { _count: { select: { tracks: true } } },
  });

  if (!album) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (album._count.tracks > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete album with ${album._count.tracks} track(s). Remove or reassign them first.`,
      },
      { status: 409 }
    );
  }

  await db.album.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
