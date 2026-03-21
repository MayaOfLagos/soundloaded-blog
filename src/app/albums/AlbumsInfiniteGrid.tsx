"use client";

import { useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Disc, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import type { AlbumCardData } from "@/lib/api/music";
import { Skeleton } from "@/components/ui/skeleton";

interface AlbumsResponse {
  albums: AlbumCardData[];
  nextCursor: string | null;
}

interface AlbumsInfiniteGridProps {
  initialAlbums: AlbumCardData[];
  initialNextCursor: string | null;
}

export function AlbumsInfiniteGrid({ initialAlbums, initialNextCursor }: AlbumsInfiniteGridProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery<AlbumsResponse>(
    {
      queryKey: ["albums-infinite"],
      queryFn: async ({ pageParam }) => {
        const params = new URLSearchParams({ limit: "10" });
        if (pageParam) params.set("cursor", pageParam as string);
        const { data } = await axios.get<AlbumsResponse>(`/api/albums?${params}`);
        return data;
      },
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      initialData: {
        pages: [{ albums: initialAlbums, nextCursor: initialNextCursor }],
        pageParams: [undefined],
      },
    }
  );

  const albums = data?.pages.flatMap((p) => p.albums) ?? [];

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        },
        { rootMargin: "200px" }
      );
      observerRef.current.observe(node);
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  if (!albums.length) {
    return (
      <EmptyState
        icon={Disc}
        title="No albums yet"
        description="Albums, EPs, and mixtapes will appear here once uploaded. Check back for new releases!"
        actionLabel="Browse Music"
        actionHref="/music"
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {albums.map((album) => (
          <div
            key={album.id}
            className="group overflow-hidden rounded-xl transition-all duration-200"
          >
            <Link href={`/albums/${album.slug}`}>
              <div className="bg-muted relative aspect-square overflow-hidden rounded-xl">
                {album.coverArt ? (
                  <Image
                    src={album.coverArt}
                    alt={album.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : (
                  <div className="from-brand/10 to-muted flex h-full items-center justify-center bg-gradient-to-br">
                    <Disc className="text-muted-foreground/40 h-12 w-12" />
                  </div>
                )}
              </div>
            </Link>
            <div className="pt-2.5 pb-1">
              <Link href={`/albums/${album.slug}`}>
                <p className="text-foreground group-hover:text-brand line-clamp-1 text-sm font-semibold transition-colors">
                  {album.title}
                </p>
              </Link>
              <Link
                href={`/artists/${album.artistSlug}`}
                className="text-muted-foreground hover:text-brand mt-0.5 block truncate text-xs transition-colors"
              >
                {album.artistName}
              </Link>
              <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-[11px]">
                {album.releaseYear && <span>{album.releaseYear}</span>}
                {album.releaseYear && album.trackCount > 0 && <span>·</span>}
                {album.trackCount > 0 && (
                  <span>
                    {album.trackCount} {album.trackCount === 1 ? "track" : "tracks"}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sentinel for intersection observer */}
      <div ref={sentinelRef} className="h-1" />

      {/* Loading spinner */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-8">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </div>
      )}

      {/* End of list */}
      {!hasNextPage && albums.length > 0 && (
        <div className="py-10 text-center">
          <p className="text-muted-foreground text-sm font-medium">
            You&apos;ve caught up! That&apos;s all the albums for now.
          </p>
        </div>
      )}
    </>
  );
}

export function AlbumsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i}>
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="pt-2.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="mt-1 h-3 w-1/2" />
            <Skeleton className="mt-1 h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
