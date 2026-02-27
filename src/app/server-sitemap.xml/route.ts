import { getServerSideSitemap } from "next-sitemap";
import { db } from "@/lib/db";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://soundloaded.ng";

export async function GET() {
  const [posts, artists] = await Promise.all([
    db.post.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, type: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 1000,
    }),
    db.artist.findMany({
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 500,
    }),
  ]);

  const postEntries = posts.map((post) => {
    const prefix =
      post.type === "NEWS"
        ? "news"
        : post.type === "MUSIC"
          ? "music"
          : post.type === "GIST"
            ? "gist"
            : post.type === "ALBUM"
              ? "albums"
              : "news";
    return {
      loc: `${SITE_URL}/${prefix}/${post.slug}`,
      lastmod: post.updatedAt.toISOString(),
      changefreq: "weekly" as const,
      priority: 0.8,
    };
  });

  const artistEntries = artists.map((artist) => ({
    loc: `${SITE_URL}/artists/${artist.slug}`,
    lastmod: artist.updatedAt.toISOString(),
    changefreq: "monthly" as const,
    priority: 0.6,
  }));

  return getServerSideSitemap([...postEntries, ...artistEntries]);
}
