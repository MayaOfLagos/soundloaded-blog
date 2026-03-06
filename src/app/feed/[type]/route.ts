import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getPostUrl } from "@/lib/urls";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://soundloadedblog.ng";

const TYPE_MAP: Record<string, string> = {
  news: "NEWS",
  music: "MUSIC",
  gist: "GIST",
  album: "ALBUM",
};

const TYPE_LABELS: Record<string, { title: string; desc: string }> = {
  news: { title: "Music News", desc: "Latest music news from Nigeria and Africa" },
  music: {
    title: "Free Music Downloads",
    desc: "Free music downloads — latest singles and tracks",
  },
  gist: { title: "Gist & Entertainment", desc: "Entertainment gist, celebrity news and more" },
  album: { title: "Albums & EPs", desc: "Latest albums, EPs and mixtapes" },
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const key = type.toLowerCase();
  const postType = TYPE_MAP[key];

  if (!postType) {
    return new Response("Not Found", { status: 404 });
  }

  const label = TYPE_LABELS[key];

  const posts = await db.post.findMany({
    where: { status: "PUBLISHED", type: postType as never },
    orderBy: { publishedAt: "desc" },
    take: 50,
    select: {
      slug: true,
      title: true,
      excerpt: true,
      publishedAt: true,
      coverImage: true,
      id: true,
      author: { select: { name: true } },
      category: { select: { name: true, slug: true } },
    },
  });

  const settingsRaw = await db.siteSettings.findUnique({
    where: { id: "default" },
    select: { permalinkStructure: true },
  });
  const permalinkStructure = settingsRaw?.permalinkStructure ?? "/%postname%";

  const items = posts
    .map((post) => {
      const url = `${SITE_URL}${getPostUrl(post, permalinkStructure)}`;
      const pubDate = (post.publishedAt ?? new Date()).toUTCString();
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      ${post.author?.name ? `<dc:creator>${escapeXml(post.author.name)}</dc:creator>` : ""}
      ${post.category?.name ? `<category>${escapeXml(post.category.name)}</category>` : ""}
      <description>${post.excerpt ? escapeXml(post.excerpt) : ""}</description>
      ${post.coverImage ? `<media:content url="${escapeXml(post.coverImage)}" medium="image"/>` : ""}
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Soundloaded Blog — ${escapeXml(label.title)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(label.desc)}</description>
    <language>en-ng</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed/${key}" rel="self" type="application/rss+xml"/>
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
