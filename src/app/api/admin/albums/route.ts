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

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page");

  // Simple list for dropdowns (no page param)
  if (!page) {
    const albums = await db.album.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true, artistId: true },
    });
    return NextResponse.json({ albums });
  }

  // Paginated list for admin table
  const pageNum = parseInt(page);
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const q = searchParams.get("q");

  const where = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { artist: { name: { contains: q, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const [albums, total] = await Promise.all([
    db.album.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * limit,
      take: limit,
      include: {
        artist: { select: { id: true, name: true, slug: true } },
        _count: { select: { tracks: true } },
      },
    }),
    db.album.count({ where }),
  ]);

  return NextResponse.json({ albums, total, page: pageNum, limit });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = albumSchema.parse(body);

    const album = await db.album.create({
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

    return NextResponse.json(album, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 422 });
    console.error("[POST /api/admin/albums]", err);
    return NextResponse.json({ error: "Failed to create album" }, { status: 500 });
  }
}
