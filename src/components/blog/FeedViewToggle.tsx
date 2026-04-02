"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { LayoutGrid, List, Loader2 } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { PostCard, type PostCardData } from "./PostCard";

type ViewMode = "grid" | "list";

const STORAGE_KEY = "soundloaded:feed-view";

interface FeedViewToggleProps {
  posts: PostCardData[];
  category?: string;
  type?: string;
}

interface PostsResponse {
  posts: PostCardData[];
  nextCursor: string | null;
}

export function FeedViewToggle({ posts: initialPosts, category, type }: FeedViewToggleProps) {
  const [view, setView] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ViewMode | null;
      if (saved === "grid" || saved === "list") return saved;
    } catch {
      /* SSR fallback */
    }
    return "grid";
  });

  const toggle = (mode: ViewMode) => {
    setView(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  };

  // Infinite scroll with cursor-based pagination
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery<PostsResponse>({
    queryKey: ["homepage-posts", category, type],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ limit: "20" });
      if (pageParam) params.set("cursor", pageParam as string);
      if (category) params.set("category", category);
      if (type) params.set("type", type);
      const { data } = await axios.get<PostsResponse>(`/api/posts?${params}`);
      return data;
    },
    initialPageParam:
      initialPosts.length > 0 ? initialPosts[initialPosts.length - 1].id : undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialData: {
      pages: [
        {
          posts: initialPosts,
          nextCursor: initialPosts.length >= 20 ? initialPosts[initialPosts.length - 1].id : null,
        },
      ],
      pageParams: [undefined],
    },
    staleTime: 60_000,
  });

  // Intersection observer for infinite scroll
  const sentryRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const el = sentryRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersect, { rootMargin: "400px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  // Flatten all pages into a single posts array (skip first page dupes)
  const allPosts = data?.pages.flatMap((page) => page.posts) ?? initialPosts;

  return (
    <div>
      {/* Section header with view toggle */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-foreground text-lg font-extrabold tracking-tight">Latest Stories</h2>
        <div className="flex items-center gap-2">
          <div className="border-border flex rounded-lg border">
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-r-none ${view === "grid" ? "bg-muted text-foreground" : "text-muted-foreground"}`}
              onClick={() => toggle("grid")}
              title="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-l-none ${view === "list" ? "bg-muted text-foreground" : "text-muted-foreground"}`}
              onClick={() => toggle("list")}
              title="List view"
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Link
            href="/news"
            className="bg-muted text-muted-foreground hover:bg-brand/10 hover:text-brand rounded-full px-3 py-1 text-xs font-semibold transition-colors"
          >
            View all
          </Link>
        </div>
      </div>

      {/* Posts */}
      {view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="divide-border divide-y">
          {allPosts.map((post) => (
            <PostCard key={post.id} post={post} variant="compact" />
          ))}
        </div>
      )}

      {/* Infinite scroll sentry */}
      <div ref={sentryRef} className="py-4 text-center">
        {isFetchingNextPage && (
          <Loader2 className="text-muted-foreground mx-auto h-6 w-6 animate-spin" />
        )}
        {!hasNextPage && allPosts.length > 20 && (
          <p className="text-muted-foreground text-sm">You&apos;re all caught up!</p>
        )}
      </div>
    </div>
  );
}
