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
  // Google News sitemaps only include articles from the last 2 days
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const [posts, settings] = await Promise.all([
    db.post.findMany({
      where: {
        status: "PUBLISHED",
        type: { in: ["NEWS", "GIST"] },
        publishedAt: { gte: twoDaysAgo },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        publishedAt: true,
        category: { select: { name: true, slug: true } },
        author: { select: { name: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 1000,
    }),
    db.siteSettings.findUnique({
      where: { id: "default" },
      select: { siteName: true, permalinkStructure: true },
    }),
  ]);

  const siteName = settings?.siteName ?? "Soundloaded Blog";
  const permalinkStructure = settings?.permalinkStructure ?? "/%postname%";

  const items = posts
    .map(
      (p) => `
  <url>
    <loc>${SITE_URL}${escapeXml(getPostUrl(p, permalinkStructure))}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(siteName)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${(p.publishedAt ?? new Date()).toISOString()}</news:publication_date>
      <news:title>${escapeXml(p.title)}</news:title>
      ${p.category ? `<news:keywords>${escapeXml(p.category.name)}</news:keywords>` : ""}
    </news:news>
  </url>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
