import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPostUrl } from "@/lib/urls";

interface SimpleResult {
  id: string;
  title: string;
  type: "post" | "music" | "artist" | "album";
  slug: string;
  subtitle?: string;
  href?: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const full = searchParams.get("full") === "1";

  if (!q || q.length < 2) {
    return NextResponse.json(
      full ? { results: { posts: [], music: [], artists: [] } } : { results: [] }
    );
  }

  try {
    const settingsRaw = await db.siteSettings.findUnique({
      where: { id: "default" },
      select: { permalinkStructure: true },
    });
    const permalinkStructure = settingsRaw?.permalinkStructure ?? "/%postname%";

    const [posts, music, artists] = await Promise.all([
      db.post.findMany({
        where: {
          status: "PUBLISHED",
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { excerpt: { contains: q, mode: "insensitive" } },
          ],
        },
        take: full ? 12 : 5,
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          coverImage: true,
          publishedAt: true,
          views: true,
          category: { select: { name: true, slug: true } },
          author: { select: { name: true, image: true } },
        },
      }),
      db.music.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { artist: { name: { contains: q, mode: "insensitive" } } },
          ],
        },
        take: full ? 8 : 3,
        include: { artist: { select: { name: true } }, album: { select: { title: true } } },
      }),
      db.artist.findMany({
        where: { name: { contains: q, mode: "insensitive" } },
        take: full ? 8 : 3,
        include: { _count: { select: { music: true } } },
      }),
    ]);

    if (full) {
      return NextResponse.json({
        results: {
          posts: posts.map((p) => ({
            id: p.id,
            slug: p.slug,
            title: p.title,
            excerpt: p.excerpt,
            coverImage: p.coverImage,
            publishedAt: p.publishedAt,
            viewCount: p.views,
            category: p.category,
            author: p.author.name ? { name: p.author.name, avatar: p.author.image } : null,
          })),
          music: music.map((m) => ({
            id: m.id,
            slug: m.slug,
            title: m.title,
            artistName: m.artist.name,
            albumTitle: m.album?.title,
            coverArt: m.coverArt,
            genre: m.genre,
            downloadCount: m.downloadCount,
            fileSize: null,
            releaseYear: m.year,
          })),
          artists: artists.map((a) => ({
            id: a.id,
            slug: a.slug,
            name: a.name,
            photo: a.photo,
            genre: a.genre,
            songCount: a._count.music,
          })),
        },
      });
    }

    const results: SimpleResult[] = [
      ...posts.map((p) => ({
        id: p.id,
        title: p.title,
        type: "post" as const,
        slug: p.slug,
        subtitle: p.category?.name,
        href: getPostUrl(p, permalinkStructure),
      })),
      ...music.map((m) => ({
        id: m.id,
        title: m.title,
        type: "music" as const,
        slug: m.slug,
        subtitle: m.artist.name,
      })),
      ...artists.map((a) => ({
        id: a.id,
        title: a.name,
        type: "artist" as const,
        slug: a.slug,
        subtitle: a.genre ?? undefined,
      })),
    ];

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[GET /api/search]", err);
    return NextResponse.json(
      full ? { results: { posts: [], music: [], artists: [] } } : { results: [] }
    );
  }
}
