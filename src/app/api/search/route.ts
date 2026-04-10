import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPostUrl } from "@/lib/urls";
import { searchAll } from "@/lib/meilisearch";

function trackSearch(
  query: string,
  results: number,
  _ip: string | null,
  engine: string = "meilisearch"
) {
  // Note: IP is no longer stored for GDPR compliance
  db.searchQuery
    .create({
      data: { query: query.toLowerCase().slice(0, 200), results, ip: null, engine },
    })
    .catch(() => {});
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ posts: [], music: [], artists: [] });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  try {
    // Try Meilisearch first
    const meili = await searchAll(q);

    const settingsRaw = await db.siteSettings.findUnique({
      where: { id: "default" },
      select: { permalinkStructure: true },
    });
    const permalinkStructure = settingsRaw?.permalinkStructure ?? "/%postname%";

    const totalResults = meili.posts.length + meili.music.length + meili.artists.length;
    trackSearch(q, totalResults, ip);

    return NextResponse.json({
      posts: meili.posts.map((p: Record<string, unknown>) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt ?? null,
        coverImage: p.coverImage ?? null,
        publishedAt: p.publishedAt ?? p.createdAt ?? null,
        category: p.categoryName ? { name: p.categoryName, slug: p.categorySlug } : null,
        type: p.type ?? null,
        href: getPostUrl(
          {
            slug: p.slug as string,
            id: p.id as string,
            category: p.categorySlug ? { slug: p.categorySlug as string } : null,
          },
          permalinkStructure
        ),
      })),
      music: meili.music.map((m: Record<string, unknown>) => ({
        id: m.id,
        slug: m.slug,
        title: m.title,
        artist: m.artistName ?? null,
        coverArt: m.coverArt ?? null,
        genre: m.genre ?? null,
        href: `/music/${m.slug}`,
      })),
      artists: meili.artists.map((a: Record<string, unknown>) => ({
        id: a.id,
        slug: a.slug,
        name: a.name,
        photo: a.photo ?? null,
        genre: a.genre ?? null,
        verified: a.verified ?? false,
        songCount: (a.songCount as number) ?? 0,
        followerCount: 0,
        href: `/artists/${a.slug}`,
      })),
    });
  } catch {
    // Meilisearch unavailable — fall back to PostgreSQL
    return fallbackSearch(q, ip);
  }
}

async function fallbackSearch(q: string, ip: string | null) {
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
            { category: { name: { contains: q, mode: "insensitive" } } },
            { tags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } } },
          ],
        },
        take: 10,
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          coverImage: true,
          publishedAt: true,
          createdAt: true,
          category: { select: { name: true, slug: true } },
        },
      }),
      db.music.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { genre: { contains: q, mode: "insensitive" } },
            { artist: { name: { contains: q, mode: "insensitive" } } },
            { album: { title: { contains: q, mode: "insensitive" } } },
          ],
        },
        take: 8,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          slug: true,
          title: true,
          coverArt: true,
          genre: true,
          artist: { select: { name: true } },
        },
      }),
      db.artist.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { genre: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 6,
        include: { _count: { select: { music: true, artistFollows: true } } },
      }),
    ]);

    trackSearch(q, posts.length + music.length + artists.length, ip, "postgresql");

    return NextResponse.json({
      posts: posts.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        coverImage: p.coverImage,
        publishedAt: p.publishedAt ?? p.createdAt,
        category: p.category?.name ?? null,
        href: getPostUrl(p, permalinkStructure),
      })),
      music: music.map((m) => ({
        id: m.id,
        slug: m.slug,
        title: m.title,
        artist: m.artist.name,
        coverArt: m.coverArt,
        genre: m.genre,
        href: `/music/${m.slug}`,
      })),
      artists: artists.map((a) => ({
        id: a.id,
        slug: a.slug,
        name: a.name,
        photo: a.photo,
        genre: a.genre,
        verified: a.verified,
        songCount: a._count.music,
        followerCount: a._count.artistFollows,
        href: `/artists/${a.slug}`,
      })),
    });
  } catch (err) {
    console.error("[GET /api/search] fallback error:", err);
    return NextResponse.json({ posts: [], music: [], artists: [] });
  }
}
