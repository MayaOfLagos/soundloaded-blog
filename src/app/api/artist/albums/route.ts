import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const artistAlbumSchema = z.object({
  title: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/),
  coverArt: z.string().url().optional().nullable().or(z.literal("")),
  releaseDate: z.string().optional().nullable(),
  type: z.enum(["ALBUM", "EP", "MIXTAPE", "COMPILATION"]).default("ALBUM"),
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

export async function GET(req: NextRequest) {
  const result = await requireArtist();
  if (!result) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const where = { artistId: result.artistProfileId };

  const [albums, total] = await Promise.all([
    db.album.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { tracks: true } } },
    }),
    db.album.count({ where }),
  ]);

  return NextResponse.json({ albums, total, page, limit });
}

export async function POST(req: NextRequest) {
  const result = await requireArtist();
  if (!result) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = artistAlbumSchema.parse(body);

    // Handle slug collision
    let finalSlug = data.slug;
    let existing = await db.album.findUnique({ where: { slug: finalSlug } });
    let counter = 2;
    while (existing) {
      finalSlug = `${data.slug}-${counter}`;
      existing = await db.album.findUnique({ where: { slug: finalSlug } });
      counter++;
    }

    const album = await db.album.create({
      data: {
        title: data.title,
        slug: finalSlug,
        coverArt: data.coverArt || null,
        releaseDate: data.releaseDate ? new Date(data.releaseDate) : null,
        type: data.type,
        genre: data.genre ?? null,
        label: data.label ?? null,
        artistId: result.artistProfileId,
      },
    });

    return NextResponse.json(album, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 422 });
    console.error("[POST /api/artist/albums]", err);
    return NextResponse.json({ error: "Failed to create album" }, { status: 500 });
  }
}
