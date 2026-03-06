import { db } from "@/lib/db";
import { getPostUrl } from "@/lib/urls";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://soundloadedblog.ng";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const settingsRaw = await db.siteSettings.findUnique({
    where: { id: "default" },
    select: {
      siteName: true,
      metaDescription: true,
      feedItemCount: true,
      feedContentMode: true,
      permalinkStructure: true,
    },
  });

  const feedLimit = settingsRaw?.feedItemCount ?? 20;

  const posts = await db.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: feedLimit,
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      type: true,
      publishedAt: true,
      coverImage: true,
      author: { select: { name: true } },
      category: { select: { name: true, slug: true } },
    },
  });

  const settings = settingsRaw;

  const siteName = settings?.siteName ?? "Soundloaded Blog";
  const siteDescription =
    settings?.metaDescription ?? "Nigeria's #1 music news and free downloads blog";

  const items = posts
    .map((post) => {
      const permalinkStructure = settingsRaw?.permalinkStructure ?? "/%postname%";
      const url = `${SITE_URL}${getPostUrl(post, permalinkStructure)}`;
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
      ${post.author?.name ? `<dc:creator>${escapeXml(post.author.name)}</dc:creator>` : ""}
      ${post.category?.name ? `<category>${escapeXml(post.category.name)}</category>` : ""}
      <description>${description}</description>
      ${imageTag}
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>en-ng</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/icons/icon-192.png</url>
      <title>${escapeXml(siteName)}</title>
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
