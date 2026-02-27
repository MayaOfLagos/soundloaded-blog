import { Suspense } from "react";
import type { Metadata } from "next";
import { CategoryTabs } from "@/components/blog/CategoryTabs";
import { AlbumCard } from "@/components/music/AlbumCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getLatestAlbums } from "@/lib/api/music";

export const metadata: Metadata = {
  title: "Albums & EPs",
  description: "Browse and download Nigerian music albums and EPs on Soundloaded Blog.",
};

export const revalidate = 300;

export default async function AlbumsPage() {
  return (
    <>
      <CategoryTabs />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="text-foreground text-2xl font-black">Albums & EPs</h1>
          <p className="text-muted-foreground mt-1">
            Browse and download Nigerian music albums and EPs.
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
                  </div>
                </div>
              ))}
            </div>
          }
        >
          <AlbumsGrid />
        </Suspense>
      </div>
    </>
  );
}

async function AlbumsGrid() {
  const albums = await getLatestAlbums({ limit: 20 });

  if (!albums.length) {
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-4xl">💿</p>
        <p className="text-xl font-bold">No albums yet</p>
        <p className="text-muted-foreground mt-2">Albums and EPs will appear here once uploaded.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {albums.map((album) => (
        <AlbumCard key={album.id} album={album} />
      ))}
    </div>
  );
}
