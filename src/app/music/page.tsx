import { Suspense } from "react";
import type { Metadata } from "next";
import { CategoryTabs } from "@/components/blog/CategoryTabs";
import { MusicCard } from "@/components/music/MusicCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getLatestMusic } from "@/lib/api/music";

export const metadata: Metadata = {
  title: "Free Music Downloads",
  description:
    "Download the latest Afrobeats, Afropop, and Nigerian music for free on Soundloaded Blog.",
};

export const revalidate = 60;

export default async function MusicPage() {
  return (
    <>
      <CategoryTabs />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="text-foreground text-2xl font-black">Free Music Downloads</h1>
          <p className="text-muted-foreground mt-1">
            Download the latest Afrobeats, Afropop, and Nigerian music for free.
          </p>
        </div>
        <Suspense
          fallback={
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="border-border overflow-hidden rounded-xl border">
                  <Skeleton className="aspect-square w-full" />
                  <div className="space-y-2 p-3">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="mt-1 h-7 w-full" />
                  </div>
                </div>
              ))}
            </div>
          }
        >
          <MusicGrid />
        </Suspense>
      </div>
    </>
  );
}

async function MusicGrid() {
  const tracks = await getLatestMusic({ limit: 20 });

  if (!tracks.length) {
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-4xl">🎵</p>
        <p className="text-xl font-bold">No music uploaded yet</p>
        <p className="text-muted-foreground mt-2">
          Music will appear here once uploaded from the admin panel.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {tracks.map((track) => (
        <MusicCard key={track.id} track={track} />
      ))}
    </div>
  );
}
