import { Suspense } from "react";
import type { Metadata } from "next";
import {
  getLatestMusic,
  getPopularMusic,
  getMostStreamedMusic,
  getLatestAlbums,
  getLatestArtists,
  getDistinctGenres,
  getTopGenresWithTracks,
  getPublicPlaylists,
} from "@/lib/api/music";
import { getSettings } from "@/lib/settings";
import { SectionDisabled } from "@/components/common/SectionDisabled";
import { JsonLd } from "@/components/common/JsonLd";
import { buildCollectionPageSchema } from "@/lib/structured-data";
import { MusicPageLayout } from "@/components/music/MusicPageLayout";
import { MusicPageClient } from "./MusicPageClient";
import { MusicSortedGrid } from "./MusicSortedGrid";
import { Music2 } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";

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
export const maxDuration = 10;

interface MusicPageProps {
  searchParams: Promise<{ sort?: string }>;
}

export default async function MusicPage({ searchParams }: MusicPageProps) {
  const { sort } = await searchParams;
  const settings = await getSettings();
  if (!settings.enableMusic) return <SectionDisabled section="Music" />;

  const isSorted = sort === "latest" || sort === "popular";

  const schema = buildCollectionPageSchema(
    isSorted ? (sort === "latest" ? "New Releases" : "Trending Music") : "Music",
    `Stream and download the latest Afrobeats and Nigerian music on ${settings.siteName}.`,
    isSorted ? `/music?sort=${sort}` : "/music",
    settings.siteUrl,
    settings.siteName
  );

  return (
    <>
      <JsonLd schema={[schema]} />
      <MusicPageLayout
        rightSidebar={
          <Suspense fallback={<RightSidebarSkeleton />}>
            <MusicRightSidebarWrapper />
          </Suspense>
        }
      >
        {isSorted ? (
          <MusicSortedGrid sort={sort as "latest" | "popular"} />
        ) : (
          <Suspense fallback={<MusicPageSkeleton />}>
            <MusicShelves />
          </Suspense>
        )}
      </MusicPageLayout>
    </>
  );
}

async function MusicShelves() {
  const [
    newReleases,
    trending,
    mostStreamed,
    albumsResult,
    artists,
    genres,
    genreShelves,
    playlists,
  ] = await Promise.all([
    getLatestMusic({ limit: 20 }),
    getPopularMusic({ limit: 20 }),
    getMostStreamedMusic({ limit: 15 }),
    getLatestAlbums({ limit: 15 }),
    getLatestArtists({ limit: 15 }),
    getDistinctGenres(),
    getTopGenresWithTracks({ genreLimit: 3, trackLimit: 20 }),
    getPublicPlaylists({ limit: 10 }),
  ]);
  const albums = albumsResult.albums;

  if (!newReleases.length && !trending.length) {
    return (
      <EmptyState
        icon={Music2}
        title="No music uploaded yet"
        description="Tracks, singles, and albums will appear here once uploaded. Fresh music is on the way!"
      />
    );
  }

  return (
    <MusicPageClient
      newReleases={newReleases}
      trending={trending}
      mostStreamed={mostStreamed}
      albums={albums}
      artists={artists}
      genres={genres}
      genreShelves={genreShelves}
      playlists={playlists}
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

      {/* Grid skeleton (New Releases) */}
      <div>
        <div className="skeleton-shimmer mb-4 h-6 w-40 rounded" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-3">
              <div className="skeleton-shimmer aspect-square w-full rounded-md" />
              <div className="mt-2 space-y-1.5">
                <div className="skeleton-shimmer h-3.5 w-full rounded" />
                <div className="skeleton-shimmer h-3 w-2/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shelf skeleton (Trending) */}
      <div>
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

      {/* List skeleton (Most Streamed) */}
      <div>
        <div className="skeleton-shimmer mb-4 h-6 w-40 rounded" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5">
            <div className="skeleton-shimmer h-5 w-5 rounded" />
            <div className="skeleton-shimmer h-10 w-10 flex-shrink-0 rounded" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="skeleton-shimmer h-3.5 w-3/4 rounded" />
              <div className="skeleton-shimmer h-3 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>
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
