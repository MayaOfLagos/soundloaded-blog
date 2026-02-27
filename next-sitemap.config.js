/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://soundloaded.ng",
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
      `${process.env.NEXT_PUBLIC_SITE_URL || "https://soundloaded.ng"}/server-sitemap.xml`,
    ],
  },
};
