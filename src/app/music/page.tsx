import { Suspense } from "react";
import type { Metadata } from "next";
import {
  getLatestMusic,
  getPopularMusic,
  getLatestAlbums,
  getLatestArtists,
  getDistinctGenres,
  getTopGenresWithTracks,
} from "@/lib/api/music";
import { getSettings } from "@/lib/settings";
import { SectionDisabled } from "@/components/common/SectionDisabled";
import { JsonLd } from "@/components/common/JsonLd";
import { buildCollectionPageSchema } from "@/lib/structured-data";
import { MusicLeftSidebar } from "@/components/music/MusicLeftSidebar";
import { MusicPageClient } from "./MusicPageClient";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const description = `Stream and download the latest Afrobeats, Afropop, and Nigerian music for free on ${s.siteName}.`;
  return {
    title: "Music",
    description,
    alternates: { canonical: "/music" },
    openGraph: {
      title: `Music | ${s.siteName}`,
      description,
      images: s.defaultOgImage ? [{ url: s.defaultOgImage }] : [],
    },
  };
}

export const revalidate = 60;

export default async function MusicPage() {
  const settings = await getSettings();
  if (!settings.enableMusic) return <SectionDisabled section="Music" />;

  const schema = buildCollectionPageSchema(
    "Music",
    `Stream and download the latest Afrobeats and Nigerian music on ${settings.siteName}.`,
    "/music",
    settings.siteUrl,
    settings.siteName
  );

  return (
    <>
      <JsonLd schema={[schema]} />
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-6 py-5 lg:grid-cols-[1fr_300px] xl:grid-cols-[220px_1fr_300px]">
          {/* Left sidebar — music navigation */}
          <MusicLeftSidebar />

          {/* Main content */}
          <main className="min-w-0">
            <Suspense fallback={<MusicPageSkeleton />}>
              <MusicShelves />
            </Suspense>
          </main>

          {/* Right sidebar — trending & popular (server-rendered) */}
          <Suspense fallback={<RightSidebarSkeleton />}>
            <MusicRightSidebarWrapper />
          </Suspense>
        </div>
      </div>
    </>
  );
}

async function MusicShelves() {
  const [newReleases, trending, albums, artists, genres, genreShelves] = await Promise.all([
    getLatestMusic({ limit: 20 }),
    getPopularMusic({ limit: 20 }),
    getLatestAlbums({ limit: 15 }),
    getLatestArtists({ limit: 15 }),
    getDistinctGenres(),
    getTopGenresWithTracks({ genreLimit: 3, trackLimit: 20 }),
  ]);

  if (!newReleases.length && !trending.length) {
    return (
      <div className="py-20 text-center">
        <p className="text-xl font-bold">No music uploaded yet</p>
        <p className="text-muted-foreground mt-2">
          Music will appear here once uploaded from the admin panel.
        </p>
      </div>
    );
  }

  return (
    <MusicPageClient
      newReleases={newReleases}
      trending={trending}
      albums={albums}
      artists={artists}
      genres={genres}
      genreShelves={genreShelves}
    />
  );
}

async function MusicRightSidebarWrapper() {
  const { MusicRightSidebar } = await import("@/components/music/MusicRightSidebar");

  const [trending, popular] = await Promise.all([
    getLatestMusic({ limit: 8 }),
    getPopularMusic({ limit: 8 }),
  ]);

  return <MusicRightSidebar trending={trending} popular={popular} />;
}

// ── Skeletons ──

function MusicPageSkeleton() {
  return (
    <div className="space-y-10">
      {/* Chip bar skeleton */}
      <div className="flex gap-2 py-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer h-9 w-20 flex-shrink-0 rounded-full" />
        ))}
      </div>

      {/* Heading skeleton */}
      <div>
        <div className="skeleton-shimmer h-9 w-48 rounded" />
        <div className="skeleton-shimmer mt-2 h-4 w-80 rounded" />
      </div>

      {/* Shelf skeletons */}
      {Array.from({ length: 3 }).map((_, s) => (
        <div key={s}>
          <div className="skeleton-shimmer mb-3 h-6 w-40 rounded" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-[180px] min-w-[180px] flex-shrink-0">
                <div className="skeleton-shimmer aspect-square w-full rounded-md" />
                <div className="mt-2 space-y-1.5">
                  <div className="skeleton-shimmer h-3.5 w-full rounded" />
                  <div className="skeleton-shimmer h-3 w-2/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RightSidebarSkeleton() {
  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] space-y-5 overflow-y-auto pb-8 lg:block">
      {Array.from({ length: 2 }).map((_, s) => (
        <div key={s} className="bg-card/50 ring-border/40 overflow-hidden rounded-2xl ring-1">
          {/* Header */}
          <div className="border-border/50 flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="skeleton-shimmer h-7 w-7 rounded-lg" />
              <div className="skeleton-shimmer h-4 w-24 rounded" />
            </div>
            <div className="skeleton-shimmer h-5 w-12 rounded-full" />
          </div>

          {/* Track rows */}
          <div className="divide-border/30 divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <div className="skeleton-shimmer h-4 w-5 rounded" />
                <div className="skeleton-shimmer h-10 w-10 flex-shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="skeleton-shimmer h-3.5 w-full rounded" />
                  <div className="skeleton-shimmer h-3 w-2/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}
