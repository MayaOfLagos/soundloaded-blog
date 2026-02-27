import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "12", 10), 50);
  const q = searchParams.get("q") ?? undefined;

  try {
    const where = q ? { name: { contains: q, mode: "insensitive" as const } } : {};

    const [artists, total] = await Promise.all([
      db.artist.findMany({
        where,
        orderBy: { name: "asc" },
        take: limit,
        skip: (page - 1) * limit,
        include: { _count: { select: { music: true, albums: true } } },
      }),
      db.artist.count({ where }),
    ]);

    return NextResponse.json({
      artists,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch artists" }, { status: 500 });
  }
}
