import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { artistSchema } from "@/lib/validations/artist";
import { indexArtist, removeFromIndex, INDEXES } from "@/lib/meilisearch";
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
  const artist = await db.artist.findUnique({
    where: { id },
    include: { _count: { select: { music: true, albums: true } } },
  });

  if (!artist) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(artist);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const data = artistSchema.parse(body);

    const artist = await db.artist.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        bio: data.bio ?? null,
        photo: data.photo || null,
        country: data.country || "Nigeria",
        genre: data.genre ?? null,
        instagram: data.instagram ?? null,
        twitter: data.twitter ?? null,
        facebook: data.facebook ?? null,
        spotify: data.spotify ?? null,
        appleMusic: data.appleMusic ?? null,
      },
    });

    indexArtist(artist);
    return NextResponse.json(artist);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 422 });
    console.error("[PUT /api/admin/artists]", err);
    return NextResponse.json({ error: "Failed to update artist" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const counts = await db.artist.findUnique({
    where: { id },
    include: { _count: { select: { music: true, albums: true } } },
  });

  if (!counts) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (counts._count.music > 0 || counts._count.albums > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete artist with ${counts._count.music} track(s) and ${counts._count.albums} album(s). Remove or reassign them first.`,
      },
      { status: 409 }
    );
  }

  await db.artist.delete({ where: { id } });
  removeFromIndex(INDEXES.ARTISTS, id);

  return NextResponse.json({ deleted: true });
}
