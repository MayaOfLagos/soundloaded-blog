import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "12", 10), 50);
  const genre = searchParams.get("genre") ?? undefined;
  const artistId = searchParams.get("artist") ?? undefined;
  const q = searchParams.get("q") ?? undefined;

  try {
    const where = {
      ...(genre ? { genre } : {}),
      ...(artistId ? { artistId } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" as const } },
              { artist: { name: { contains: q, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    };

    const [tracks, total] = await Promise.all([
      db.music.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
        include: {
          artist: { select: { name: true, slug: true } },
          album: { select: { title: true, slug: true } },
        },
      }),
      db.music.count({ where }),
    ]);

    return NextResponse.json({
      tracks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
      },
    });
  } catch (err) {
    console.error("[GET /api/music]", err);
    return NextResponse.json({ error: "Failed to fetch music" }, { status: 500 });
  }
}
