import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const q = searchParams.get("q")?.trim();

  const where = {
    isPublic: true,
    ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [playlists, total] = await Promise.all([
    db.playlist.findMany({
      where,
      include: {
        user: { select: { name: true, username: true, image: true } },
        _count: { select: { tracks: true } },
        tracks: {
          orderBy: { position: "asc" },
          take: 4,
          include: { music: { select: { coverArt: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.playlist.count({ where }),
  ]);

  return NextResponse.json({
    playlists: playlists.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      description: p.description,
      coverImage: p.coverImage,
      isPublic: p.isPublic,
      trackCount: p._count.tracks,
      coverArts: p.tracks.map((t) => t.music.coverArt).filter(Boolean),
      creator: p.user,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
