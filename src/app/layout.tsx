import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { QueryProvider } from "@/components/common/QueryProvider";
import { ConditionalNavigation } from "@/components/layout/ConditionalNavigation";
import { getSettings } from "@/lib/settings";
import { Suspense } from "react";
import { HeadScripts, FooterScripts, CustomCss } from "@/components/common/CodeInjection";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();

  return {
    metadataBase: new URL(
      s.siteUrl || process.env.NEXT_PUBLIC_APP_URL || "https://soundloadedblog.ng"
    ),
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
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
