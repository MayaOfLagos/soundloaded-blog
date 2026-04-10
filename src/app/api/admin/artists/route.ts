import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { artistSchema } from "@/lib/validations/artist";
import { indexArtist } from "@/lib/meilisearch";
import { z } from "zod";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const q = searchParams.get("q");

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { genre: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [artists, total] = await Promise.all([
    db.artist.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { music: true, albums: true } },
      },
    }),
    db.artist.count({ where }),
  ]);

  return NextResponse.json({ artists, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    const body = await req.json();
    const data = artistSchema.parse(body);

    const artist = await db.artist.create({
      data: {
        name: data.name,
        slug: data.slug,
        bio: data.bio ?? null,
        photo: data.photo || null,
        coverImage: data.coverImage || null,
        country: data.country || "Nigeria",
        genre: data.genre ?? null,
        instagram: data.instagram ?? null,
        twitter: data.twitter ?? null,
        facebook: data.facebook ?? null,
        spotify: data.spotify ?? null,
        appleMusic: data.appleMusic ?? null,
        verified: data.verified ?? false,
      },
    });

    indexArtist(artist);
    return NextResponse.json(artist, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 422 });
    console.error("[POST /api/admin/artists]", err);
    return NextResponse.json({ error: "Failed to create artist" }, { status: 500 });
  }
}
