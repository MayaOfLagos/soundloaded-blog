import { Suspense } from "react";
import type { Metadata } from "next";
import { CategoryTabs } from "@/components/blog/CategoryTabs";
import { ArtistCard } from "@/components/music/ArtistCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getLatestArtists } from "@/lib/api/music";

export const metadata: Metadata = {
  title: "Artists",
  description:
    "Browse Nigerian and African artists on Soundloaded Blog — discographies, bios, and free downloads.",
};

export const revalidate = 300;

export default async function ArtistsPage() {
  return (
    <>
      <CategoryTabs />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="text-foreground text-2xl font-black">Artists</h1>
          <p className="text-muted-foreground mt-1">Browse Nigerian and African artists.</p>
        </div>
        <Suspense
          fallback={
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="border-border flex flex-col items-center rounded-xl border p-4"
                >
                  <Skeleton className="mb-3 h-20 w-20 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="mt-2 h-3 w-16" />
                </div>
              ))}
            </div>
          }
        >
          <ArtistsGrid />
        </Suspense>
      </div>
    </>
  );
}

async function ArtistsGrid() {
  const artists = await getLatestArtists({ limit: 24 });

  if (!artists.length) {
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-4xl">🎤</p>
        <p className="text-xl font-bold">No artists yet</p>
        <p className="text-muted-foreground mt-2">
          Artists will appear here once added from the admin panel.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {artists.map((artist) => (
        <ArtistCard key={artist.id} artist={artist} />
      ))}
    </div>
  );
}
