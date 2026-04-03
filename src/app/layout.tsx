import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { QueryProvider } from "@/components/common/QueryProvider";
import { ConditionalNavigation } from "@/components/layout/ConditionalNavigation";
import { getSettings } from "@/lib/settings";
import Script from "next/script";
import { Suspense } from "react";
import { HeadScripts, FooterScripts, CustomCss } from "@/components/common/CodeInjection";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { NotificationPrompt } from "@/components/pwa/NotificationPrompt";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();

  return {
    metadataBase: new URL(s.siteUrl || process.env.NEXT_PUBLIC_APP_URL || "https://soundloaded.ng"),
    title: {
      default: `${s.siteName} — ${s.tagline}`,
      template: s.metaTitleTemplate,
    },
    description: s.metaDescription,
    keywords: s.seoKeywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
    authors: [{ name: s.siteName, url: s.siteUrl }],
    creator: s.copyrightText.replace(". All rights reserved.", ""),
    publisher: s.copyrightText.replace(". All rights reserved.", ""),
    openGraph: {
      type: "website",
      locale: "en_NG",
      url: s.siteUrl,
      siteName: s.siteName,
      title: `${s.siteName} — ${s.tagline}`,
      description: s.metaDescription,
      images: s.defaultOgImage
        ? [{ url: s.defaultOgImage, width: 1200, height: 630, alt: s.siteName }]
        : [{ url: "/og/default.jpg", width: 1200, height: 630, alt: s.siteName }],
    },
    twitter: {
      card: "summary_large_image",
      site: s.twitter ? `@${s.twitter}` : undefined,
      creator: s.twitter ? `@${s.twitter}` : undefined,
    },
    alternates: {
      types: {
        "application/rss+xml": [{ url: `${s.siteUrl}/feed.xml`, title: `${s.siteName} RSS Feed` }],
      },
    },
    robots: s.searchEngineVisibility
      ? { index: true, follow: true }
      : { index: false, follow: false },
    manifest: "/api/manifest",
    icons: {
      icon: s.favicon || "/icons/icon-192x192.png",
      apple: "/icons/apple-touch-icon.png",
    },
    verification: {
      google: s.googleSiteVerification || undefined,
      other: s.bingSiteVerification ? { "msvalidate.01": s.bingSiteVerification } : undefined,
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <html lang={settings.language || "en"} suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta
          name="apple-mobile-web-app-title"
          content={settings.pwaShortName || settings.siteName || "Soundloaded"}
        />
        {/* iOS splash screens */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1170x2532.png"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1284x2778.png"
          media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1179x2556.png"
          media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-750x1334.png"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1125x2436.png"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-2048x2732.png"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)"
        />
        <Suspense>
          <HeadScripts />
          <CustomCss />
        </Suspense>
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <QueryProvider>
            <ConditionalNavigation>{children}</ConditionalNavigation>
          </QueryProvider>
          <Toaster
            position="bottom-center"
            gutter={8}
            containerStyle={{ bottom: 88 }}
            toastOptions={{
              duration: 3000,
              style: {
                background: "#1a1a1a",
                color: "#ededed",
                border: "1px solid #262626",
                borderRadius: "8px",
                fontSize: "14px",
                fontFamily: "var(--font-inter)",
              },
            }}
          />
        </ThemeProvider>
        <Suspense>
          <FooterScripts />
        </Suspense>
        <InstallPrompt />
        <NotificationPrompt />
        <Analytics />
        <SpeedInsights />
        {process.env.NEXT_PUBLIC_UMAMI_URL && process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
          <Script
            src={`${process.env.NEXT_PUBLIC_UMAMI_URL}/script.js`}
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
