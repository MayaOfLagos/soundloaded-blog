/** @type {import('next-sitemap').IConfig} */
// Prefer NEXT_PUBLIC_SITE_URL, then NEXT_PUBLIC_APP_URL — but reject any
// localhost value so a local dev build never bakes localhost into the sitemap.
function resolvedSiteUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ];
  for (const url of candidates) {
    if (url && !url.includes("localhost") && !url.includes("127.0.0.1")) {
      return url.replace(/\/$/, ""); // strip trailing slash
    }
  }
  return "https://soundloaded.ng";
}
const siteUrl = resolvedSiteUrl();

module.exports = {
  siteUrl,
  generateRobotsTxt: true,
  changefreq: "daily",
  priority: 0.7,
  sitemapSize: 5000,
  exclude: [
    "/admin",
    "/admin/*",
    "/api/*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/offline",
    "/feed/*",
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/login", "/register"],
      },
    ],
    additionalSitemaps: [
      `${siteUrl}/server-sitemap.xml`,
      `${siteUrl}/news-sitemap.xml`,
    ],
  },
};
