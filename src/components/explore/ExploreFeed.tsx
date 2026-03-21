"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { ExploreCard, VideoMuteProvider } from "./ExploreCard";
import { ExploreCardSkeleton } from "./ExploreCardSkeleton";
import { ExploreTabBar } from "./ExploreTabBar";
import type { ExplorePost, ExploreResult } from "@/lib/api/explore";

async function fetchExplorePage({
  pageParam,
  mode,
}: {
  pageParam: number;
  mode: string;
}): Promise<ExploreResult> {
  const params = new URLSearchParams({
    mode,
    page: String(pageParam),
    limit: "10",
  });
  const res = await axios.get<ExploreResult>(`/api/explore?${params.toString()}`);
  return res.data;
}

export function ExploreFeed() {
  const [activeTab, setActiveTab] = useState("trending");
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["explore", activeTab],
    queryFn: ({ pageParam }) => fetchExplorePage({ pageParam, mode: activeTab }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    staleTime: 2 * 60 * 1000,
  });

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const allPosts: ExplorePost[] =
    data?.pages.flatMap((page) => page.posts as unknown as ExplorePost[]) ?? [];

  return (
    <VideoMuteProvider>
      <div className="mx-auto w-full max-w-lg space-y-4 sm:max-w-xl">
        {/* Tab bar */}
        <ExploreTabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Feed */}
        {isLoading && Array.from({ length: 3 }).map((_, i) => <ExploreCardSkeleton key={i} />)}

        {!isLoading && allPosts.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-muted-foreground text-lg font-medium">No posts found</p>
            <p className="text-muted-foreground/70 mt-1 text-sm">
              Try a different tab or filter to discover content.
            </p>
          </div>
        )}

        {allPosts.map((post) => (
          <ExploreCard key={post.id} post={post} />
        ))}

        {isFetchingNextPage &&
          Array.from({ length: 2 }).map((_, i) => <ExploreCardSkeleton key={`loading-${i}`} />)}

        {/* Sentinel for infinite scroll */}
        <div ref={sentinelRef} className="h-1" />
      </div>
    </VideoMuteProvider>
  );
}
