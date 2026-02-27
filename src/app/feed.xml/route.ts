import { db } from "@/lib/db";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://soundloaded.ng";
const SITE_NAME = "Soundloaded";
const SITE_DESCRIPTION = "Nigeria's #1 music news and free downloads blog";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function postUrl(slug: string, type: string): string {
  const prefix =
    type === "NEWS"
      ? "news"
      : type === "MUSIC"
        ? "music"
        : type === "GIST"
          ? "gist"
          : type === "ALBUM"
            ? "albums"
            : "news";
  return `${SITE_URL}/${prefix}/${slug}`;
}

export async function GET() {
  const posts = await db.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 50,
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      type: true,
      publishedAt: true,
      coverImage: true,
      author: { select: { name: true } },
      category: { select: { name: true } },
    },
  });

  const items = posts
    .map((post) => {
      const url = postUrl(post.slug, post.type);
      const pubDate = (post.publishedAt ?? new Date()).toUTCString();
      const description = post.excerpt ? escapeXml(post.excerpt) : "";
      const title = escapeXml(post.title);
      const imageTag = post.coverImage
        ? `<media:content url="${escapeXml(post.coverImage)}" medium="image"/>`
        : "";

      return `
    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      ${post.author?.name ? `<author>${escapeXml(post.author.name)}</author>` : ""}
      ${post.category?.name ? `<category>${escapeXml(post.category.name)}</category>` : ""}
      <description>${description}</description>
      ${imageTag}
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en-ng</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/icons/icon-192.png</url>
      <title>${escapeXml(SITE_NAME)}</title>
      <link>${SITE_URL}</link>
    </image>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
