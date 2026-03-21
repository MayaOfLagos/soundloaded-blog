import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "12", 10), 50);
  const sort = searchParams.get("sort") ?? "a-z";
  const genre = searchParams.get("genre") ?? undefined;
  const q = searchParams.get("q") ?? undefined;

  try {
    const where: Prisma.ArtistWhereInput = {
      ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
      ...(genre ? { genre: { equals: genre, mode: "insensitive" as const } } : {}),
    };

    let orderBy: Prisma.ArtistOrderByWithRelationInput;
    switch (sort) {
      case "latest":
        orderBy = { createdAt: "desc" };
        break;
      case "popular":
        orderBy = { artistFollows: { _count: "desc" } };
        break;
      default:
        orderBy = { name: "asc" };
    }

    const [artists, total] = await Promise.all([
      db.artist.findMany({
        where,
        orderBy,
        take: limit,
        skip: (page - 1) * limit,
        include: { _count: { select: { music: true, albums: true, artistFollows: true } } },
      }),
      db.artist.count({ where }),
    ]);

    const mapped = artists.map((a) => ({
      id: a.id,
      slug: a.slug,
      name: a.name,
      photo: a.photo,
      genre: a.genre,
      verified: a.verified,
      songCount: a._count.music,
      albumCount: a._count.albums,
      followerCount: a._count.artistFollows,
    }));

    return NextResponse.json({
      artists: mapped,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch artists" }, { status: 500 });
  }
}
