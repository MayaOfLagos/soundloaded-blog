import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig, RuntimeCaching } from "serwist";
import { Serwist, CacheFirst, StaleWhileRevalidate, NetworkFirst, ExpirationPlugin } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope;

// Custom caching strategies for Soundloaded-specific routes
const customCache: RuntimeCaching[] = [
  // CDN images — cache-first, 30 days, max 200
  {
    matcher: ({ url }) =>
      url.hostname.includes("cdn.soundloaded") || url.hostname.includes("r2.dev"),
    handler: new CacheFirst({
      cacheName: "cdn-images",
      plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 })],
    }),
  },
  // API calls (except downloads/streams) — network-first, 5min cache
  {
    matcher: ({ url }) =>
      url.pathname.startsWith("/api/") &&
      !url.pathname.includes("/download") &&
      !url.pathname.includes("/stream"),
    handler: new NetworkFirst({
      cacheName: "api-data",
      plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 5 * 60 })],
    }),
  },
  // Fonts — cache-first, 1 year
  {
    matcher: ({ request }) => request.destination === "font",
    handler: new CacheFirst({
      cacheName: "fonts",
      plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 })],
    }),
  },
  // Next.js static assets — stale-while-revalidate
  {
    matcher: ({ url }) => url.pathname.startsWith("/_next/static/"),
    handler: new StaleWhileRevalidate({
      cacheName: "next-static",
      plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 })],
    }),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [...customCache, ...defaultCache],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

// ── Push Notifications ──────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sw = self as any;

sw.addEventListener(
  "push",
  (event: { data?: { json(): Record<string, string> }; waitUntil(p: Promise<unknown>): void }) => {
    const data = event.data?.json() ?? {};
    event.waitUntil(
      sw.registration.showNotification(data.title ?? "Soundloaded", {
        body: data.body ?? "New content available!",
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
        vibrate: [100, 50, 100],
        data: { url: data.url ?? "/" },
      })
    );
  }
);

sw.addEventListener(
  "notificationclick",
  (event: {
    notification: { close(): void; data?: { url?: string } };
    waitUntil(p: Promise<unknown>): void;
  }) => {
    event.notification.close();
    const url = event.notification.data?.url ?? "/";
    event.waitUntil(
      sw.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then(
          (
            windowClients: { url: string; focus(): Promise<unknown>; navigate(u: string): void }[]
          ) => {
            for (const client of windowClients) {
              if (client.url.includes(sw.location.origin) && "focus" in client) {
                client.navigate(url);
                return client.focus();
              }
            }
            return sw.clients.openWindow(url);
          }
        )
    );
  }
);
