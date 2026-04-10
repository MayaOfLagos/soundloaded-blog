import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
  const q = searchParams.get("q")?.trim();

  const where = q ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }] } : {};

  const [playlists, total] = await Promise.all([
    db.playlist.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { name: true, username: true } },
        _count: { select: { tracks: true } },
      },
    }),
    db.playlist.count({ where }),
  ]);

  return NextResponse.json({ playlists, total, page, totalPages: Math.ceil(total / limit) });
}
