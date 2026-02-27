import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { QueryProvider } from "@/components/common/QueryProvider";
import { ConditionalNavigation } from "@/components/layout/ConditionalNavigation";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://soundloadedblog.ng"),
  title: {
    default: "Soundloaded Blog — Nigeria's #1 Music Blog",
    template: "%s | Soundloaded Blog",
  },
  description:
    "Nigeria's premier music blog — latest music news, free music downloads, gist, artist profiles, and more. Empowering African artists.",
  keywords: ["Nigeria music", "Afrobeats", "free music download", "music news", "African music"],
  authors: [{ name: "Soundloaded", url: "https://soundloadedblog.ng" }],
  creator: "Soundloaded Nigeria",
  publisher: "Soundloaded Nigeria",
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://soundloadedblog.ng",
    siteName: "Soundloaded Blog",
    title: "Soundloaded Blog — Nigeria's #1 Music Blog",
    description:
      "Nigeria's premier music blog — latest music news, free music downloads, gist, and more.",
    images: [{ url: "/og/default.jpg", width: 1200, height: 630, alt: "Soundloaded Blog" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@soundloadedng",
    creator: "@soundloadedng",
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
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
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
