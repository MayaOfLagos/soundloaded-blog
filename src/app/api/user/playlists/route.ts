import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createPlaylistSchema } from "@/lib/validations/user";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));

  const [playlists, total] = await Promise.all([
    db.playlist.findMany({
      where: { userId },
      include: {
        _count: { select: { tracks: true } },
        tracks: {
          orderBy: { position: "asc" },
          take: 4,
          include: {
            music: { select: { coverArt: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.playlist.count({ where: { userId } }),
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
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "playlist"
  );
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await request.json();
  const parsed = createPlaylistSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Generate unique slug
  const baseSlug = slugify(parsed.data.title);
  let slug = baseSlug;
  let attempt = 0;
  while (await db.playlist.findUnique({ where: { userId_slug: { userId, slug } } })) {
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  const playlist = await db.playlist.create({
    data: {
      title: parsed.data.title,
      slug,
      description: parsed.data.description,
      isPublic: parsed.data.isPublic ?? false,
      userId,
    },
  });

  return NextResponse.json({ playlist }, { status: 201 });
}
