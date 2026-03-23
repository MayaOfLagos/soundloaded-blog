/** @type {import('next-sitemap').IConfig} */
const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://soundloaded.blog";

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
