"use client";

import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { Search, ListMusic, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PlaylistCard } from "@/components/music/PlaylistCard";
import { MorphingTitle } from "@/components/blog/MorphingTitle";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import type { PlaylistSummary } from "@/hooks/usePlaylist";

interface PlaylistsResponse {
  playlists: (PlaylistSummary & {
    creator: { name: string | null; username: string | null; image: string | null };
  })[];
  total: number;
  page: number;
  totalPages: number;
}

export function PlaylistsPageClient() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["public-playlists", debouncedSearch],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({ page: String(pageParam), limit: "20" });
      if (debouncedSearch) params.set("q", debouncedSearch);
      const { data } = await axios.get<PlaylistsResponse>(`/api/playlists?${params}`);
      return data;
    },
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    initialPageParam: 1,
  });

  const { ref: sentinelRef } = useInView({
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
    },
    rootMargin: "200px",
  });

  const allPlaylists = data?.pages.flatMap((p) => p.playlists) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <MorphingTitle
          titles={[
            "Community Playlists",
            "Curated Collections",
            "Public Playlists",
            "Discover Playlists",
          ]}
          className="text-3xl font-black tracking-tight sm:text-4xl"
          as="h1"
        />
        <p className="text-muted-foreground mt-2 text-sm">
          Explore playlists curated by the Soundloaded community.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search playlists..."
          className="pl-9"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
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
      ) : allPlaylists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ListMusic className="text-muted-foreground/40 mb-4 h-16 w-16" />
          <h2 className="text-foreground text-lg font-semibold">
            {debouncedSearch ? "No playlists found" : "No public playlists yet"}
          </h2>
          <p className="text-muted-foreground mt-1 max-w-sm text-sm">
            {debouncedSearch
              ? `No playlists match "${debouncedSearch}". Try a different search.`
              : "Public playlists from the community will appear here."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {allPlaylists.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} showCreator />
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-1" />

          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
