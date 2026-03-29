"use client";

import { useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Music, Play, Pause, Loader2, Clock, TrendingUp, Music2 } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { usePlayerStore } from "@/store/player.store";
import { cn } from "@/lib/utils";
import { HeartButton } from "@/components/music/HeartButton";
// import type { MusicCardData } from "@/lib/api/music";
import type { Track } from "@/store/player.store";

interface TracksResponse {
  tracks: {
    id: string;
    slug: string;
    title: string;
    coverArt: string | null;
    genre: string | null;
    downloadCount: number;
    enableDownload: boolean;
    fileSize: bigint | null;
    year: number | null;
    r2Key: string;
    duration: number | null;
    artist: { name: string; slug: string };
    album: { title: string; slug: string } | null;
  }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
  };
}

interface MusicSortedGridProps {
  sort: "latest" | "popular";
}

function toPlayerTrack(t: TracksResponse["tracks"][number]): Track {
  return {
    id: t.id,
    title: t.title,
    artist: t.artist.name,
    coverArt: t.coverArt,
    r2Key: t.r2Key,
    duration: t.duration ?? 0,
    slug: t.slug,
  };
}

export function MusicSortedGrid({ sort }: MusicSortedGridProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const { currentTrack, isPlaying, setTrack, togglePlay, setContextQueue } = usePlayerStore();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery<TracksResponse>({
      queryKey: ["music-sorted", sort],
      queryFn: async ({ pageParam }) => {
        const params = new URLSearchParams({
          sort,
          limit: "20",
          page: String(pageParam),
        });
        const { data } = await axios.get<TracksResponse>(`/api/music?${params}`);
        return data;
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage) =>
        lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    });

  const allTracks = data?.pages.flatMap((p) => p.tracks) ?? [];

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

  const handlePlay = (track: TracksResponse["tracks"][number], index: number) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      const playerTrack = toPlayerTrack(track);
      setTrack(playerTrack);
      const queue = allTracks.slice(index).map(toPlayerTrack);
      setContextQueue(queue, sort === "latest" ? "New Releases" : "Trending");
    }
  };

  const isLatest = sort === "latest";
  const title = isLatest ? "New Releases" : "Trending Now";
  const subtitle = isLatest
    ? "The latest music drops, fresh off the press."
    : "The hottest tracks everyone is downloading right now.";
  const Icon = isLatest ? Clock : TrendingUp;

  if (isLoading) {
    return <SortedGridSkeleton />;
  }

  if (!allTracks.length) {
    return (
      <EmptyState
        icon={Music2}
        title="No tracks yet"
        description={`Check back later for ${isLatest ? "new releases" : "trending tracks"}. Fresh music is always on the way!`}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="bg-brand/10 flex h-10 w-10 items-center justify-center rounded-xl">
            <Icon className="text-brand h-5 w-5" />
          </div>
          <div>
            <h1 className="text-foreground text-2xl font-black tracking-tight">{title}</h1>
            <p className="text-muted-foreground text-sm">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Track grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {allTracks.map((track, index) => {
          const isCurrentTrack = currentTrack?.id === track.id;
          const isTrackPlaying = isCurrentTrack && isPlaying;

          return (
            <div key={track.id} className="group">
              {/* Cover */}
              <div
                className="bg-muted relative aspect-square cursor-pointer overflow-hidden rounded-xl"
                onClick={() => handlePlay(track, index)}
              >
                {track.coverArt ? (
                  <Image
                    src={track.coverArt}
                    alt={track.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : (
                  <div className="from-brand/10 to-muted flex h-full items-center justify-center bg-gradient-to-br">
                    <Music className="text-muted-foreground/40 h-10 w-10" />
                  </div>
                )}

                {/* Play/Pause overlay */}
                <div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity",
                    isTrackPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-lg">
                    {isTrackPlaying ? (
                      <Pause className="h-5 w-5 fill-black text-black" />
                    ) : (
                      <Play className="ml-0.5 h-5 w-5 fill-black text-black" />
                    )}
                  </div>
                </div>

                {/* Heart */}
                <div className="absolute top-2 right-2 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                  <HeartButton musicId={track.id} size={16} />
                </div>

                {/* Rank badge for trending */}
                {sort === "popular" && index < 10 && (
                  <div className="absolute top-2 left-2">
                    <span className="bg-brand flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black text-white shadow">
                      {index + 1}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="mt-2 min-w-0">
                <Link href={`/music/${track.slug}`}>
                  <p className="text-foreground group-hover:text-brand line-clamp-1 text-sm font-semibold transition-colors">
                    {track.title}
                  </p>
                </Link>
                <Link
                  href={`/artists/${track.artist.slug}`}
                  className="text-muted-foreground hover:text-brand mt-0.5 block truncate text-xs transition-colors"
                >
                  {track.artist.name}
                </Link>
                <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-[11px]">
                  {track.genre && <span>{track.genre}</span>}
                  {track.genre && track.downloadCount > 0 && <span>·</span>}
                  {track.downloadCount > 0 && (
                    <span>{track.downloadCount.toLocaleString()} downloads</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {/* Loading */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-8">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </div>
      )}

      {/* End */}
      {!hasNextPage && allTracks.length > 0 && (
        <div className="py-10 text-center">
          <p className="text-muted-foreground text-sm font-medium">
            You&apos;ve caught up! That&apos;s all the{" "}
            {isLatest ? "new releases" : "trending tracks"} for now.
          </p>
        </div>
      )}
    </div>
  );
}

function SortedGridSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5">
        <div className="skeleton-shimmer h-10 w-10 rounded-xl" />
        <div>
          <div className="skeleton-shimmer h-7 w-40 rounded" />
          <div className="skeleton-shimmer mt-1 h-4 w-64 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i}>
            <div className="skeleton-shimmer aspect-square w-full rounded-xl" />
            <div className="mt-2">
              <div className="skeleton-shimmer h-4 w-3/4 rounded" />
              <div className="skeleton-shimmer mt-1 h-3 w-1/2 rounded" />
              <div className="skeleton-shimmer mt-1 h-3 w-1/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
