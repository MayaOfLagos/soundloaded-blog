import { withPayload } from "@payloadcms/next/withPayload";
import withSerwist from "@serwist/next";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Stub out react-native-fs — jsmediatags bundles a ReactNativeFileReader that requires it
  serverExternalPackages: ["react-native-fs"],
  turbopack: {
    resolveAlias: {
      "react-native-fs": "./src/lib/stubs/react-native-fs.js",
      jsmediatags: "jsmediatags/dist/jsmediatags.js",
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "react-native-fs": false,
    };
    return config;
  },
  // Allow phones/devices on the same LAN to access dev server without CORS warnings
  allowedDevOrigins: ["192.168.1.*", "192.168.0.*", "10.*", "127.*"],
  transpilePackages: ["filepond", "react-filepond"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.soundloadedblog.ng",
      },
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel-analytics.com https://*.vercel-insights.com https://*.vercel-scripts.com${process.env.NEXT_PUBLIC_UMAMI_URL ? ` ${process.env.NEXT_PUBLIC_UMAMI_URL}` : ""}`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://pub-a7e2363e13da41dc85ad97e68dc7713a.r2.dev https://*.r2.dev https://*.r2.cloudflarestorage.com",
              "font-src 'self' data:",
              `connect-src 'self' https://*.r2.dev https://*.r2.cloudflarestorage.com https://*.vercel-analytics.com https://*.vercel-insights.com https://api.paystack.co${process.env.NEXT_PUBLIC_UMAMI_URL ? ` ${process.env.NEXT_PUBLIC_UMAMI_URL}` : ""}${process.env.NEXT_PUBLIC_MEILISEARCH_HOST ? ` ${process.env.NEXT_PUBLIC_MEILISEARCH_HOST}` : ""}`,
              "media-src 'self' https://*.r2.dev https://*.r2.cloudflarestorage.com blob:",
              "frame-src 'self' https://checkout.paystack.com https://js.paystack.co",
              "worker-src 'self' blob:",
              "child-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

const withPWA = withSerwist({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: true,
});

export default withSentryConfig(withPWA(withPayload(nextConfig)), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  sourcemaps: { disable: true },
  disableLogger: true,
  automaticVercelMonitors: true,
});
