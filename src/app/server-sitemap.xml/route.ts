import { getServerSideSitemap } from "next-sitemap";
import { db } from "@/lib/db";
import { getPageUrl } from "@/lib/pages";
import { getPostUrl } from "@/lib/urls";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://soundloaded.ng";

export async function GET() {
  const [pages, posts, artists, albums, music, settingsRaw] = await Promise.all([
    db.page.findMany({
      where: {
        status: "PUBLISHED",
        OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
      },
      select: { slug: true, updatedAt: true, template: true },
      orderBy: { updatedAt: "desc" },
      take: 500,
    }),
    db.post.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        slug: true,
        updatedAt: true,
        publishedAt: true,
        category: { select: { slug: true } },
        author: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 1000,
    }),
    db.artist.findMany({
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 500,
    }),
    db.album.findMany({
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 500,
    }),
    db.music.findMany({
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 1000,
    }),
    db.siteSettings.findUnique({
      where: { id: "default" },
      select: { permalinkStructure: true },
    }),
  ]);

  const permalinkStructure = settingsRaw?.permalinkStructure ?? "/%postname%";

  const pageEntries = pages.map((page) => ({
    loc: `${SITE_URL}${getPageUrl(page)}`,
    lastmod: page.updatedAt.toISOString(),
    changefreq: page.template === "LEGAL" ? ("monthly" as const) : ("weekly" as const),
    priority: page.template === "LEGAL" ? 0.5 : 0.7,
  }));

  const postEntries = posts.map((post) => ({
    loc: `${SITE_URL}${getPostUrl(post, permalinkStructure)}`,
    lastmod: post.updatedAt.toISOString(),
    changefreq: "weekly" as const,
    priority: 0.8,
  }));

  const artistEntries = artists.map((artist) => ({
    loc: `${SITE_URL}/artists/${artist.slug}`,
    lastmod: artist.updatedAt.toISOString(),
    changefreq: "monthly" as const,
    priority: 0.6,
  }));

  const albumEntries = albums.map((album) => ({
    loc: `${SITE_URL}/albums/${album.slug}`,
    lastmod: album.updatedAt.toISOString(),
    changefreq: "monthly" as const,
    priority: 0.7,
  }));

  const musicEntries = music.map((track) => ({
    loc: `${SITE_URL}/music/${track.slug}`,
    lastmod: track.updatedAt.toISOString(),
    changefreq: "monthly" as const,
    priority: 0.7,
  }));

  return getServerSideSitemap([
    ...pageEntries,
    ...postEntries,
    ...artistEntries,
    ...albumEntries,
    ...musicEntries,
  ]);
}
