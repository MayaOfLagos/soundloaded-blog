import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildPublicSettings } from "@/lib/settings";

export async function GET() {
  try {
    const raw = await db.siteSettings.findUnique({ where: { id: "default" } });
    const s = buildPublicSettings(raw as unknown as Record<string, unknown>);

    const defaultIcons = [
      { src: "/icons/icon-72x72.png", sizes: "72x72", type: "image/png" },
      { src: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { src: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png" },
      { src: "/icons/icon-144x144.png", sizes: "144x144", type: "image/png" },
      { src: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-384x384.png", sizes: "384x384", type: "image/png" },
      { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ];

    // If a favicon is configured but no dedicated PWA icons, promote it as a 512x512 icon
    const faviconFallback =
      s.favicon && s.pwaIcons.length === 0
        ? [{ src: s.favicon, sizes: "512x512", type: "image/png", purpose: "any maskable" }]
        : null;

    const icons = s.pwaIcons.length > 0 ? s.pwaIcons : (faviconFallback ?? defaultIcons);

    const manifest = {
      name: s.pwaAppName,
      short_name: s.pwaShortName,
      description: s.tagline,
      start_url: "/",
      display: s.pwaDisplayMode,
      orientation: s.pwaOrientation,
      background_color: s.pwaBackgroundColor,
      theme_color: s.pwaThemeColor,
      lang: "en-NG",
      dir: "ltr",
      categories: ["music", "entertainment", "news"],
      icons,
      ...(s.pwaScreenshots.length > 0 && { screenshots: s.pwaScreenshots }),
      shortcuts: [
        {
          name: "Latest Music",
          short_name: "Music",
          url: "/music",
          icons: [{ src: "/icons/icon-96x96.png", sizes: "96x96" }],
        },
        {
          name: "Music News",
          short_name: "News",
          url: "/news",
          icons: [{ src: "/icons/icon-96x96.png", sizes: "96x96" }],
        },
      ],
    };

    return new NextResponse(JSON.stringify(manifest), {
      headers: {
        "Content-Type": "application/manifest+json",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch {
    // Fallback to static manifest
    return NextResponse.redirect(
      new URL("/manifest.json", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002")
    );
  }
}
