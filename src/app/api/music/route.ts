import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "12", 10), 50);
  const sort = searchParams.get("sort") ?? "latest";
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
        orderBy: sort === "popular" ? { downloadCount: "desc" } : { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
        select: {
          id: true,
          title: true,
          slug: true,
          r2Key: true,
          coverArt: true,
          fileSize: true,
          duration: true,
          genre: true,
          year: true,
          downloadCount: true,
          streamCount: true,
          enableDownload: true,
          isExclusive: true,
          price: true,
          accessModel: true,
          streamAccess: true,
          creatorPrice: true,
          createdAt: true,
          artist: { select: { name: true, slug: true } },
          album: { select: { title: true, slug: true } },
        },
      }),
      db.music.count({ where }),
    ]);

    // Convert BigInt fileSize to Number for JSON serialization
    const serializedTracks = tracks.map((t) => ({
      ...t,
      fileSize: t.fileSize ? Number(t.fileSize) : null,
    }));

    return NextResponse.json({
      tracks: serializedTracks,
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
