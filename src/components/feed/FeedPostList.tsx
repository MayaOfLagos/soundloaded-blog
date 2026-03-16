"use client";

import { useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { useFeedPosts } from "@/lib/api/feed";
import { FeedPostCard } from "./FeedPostCard";

interface FeedPostListProps {
  feedType?: "foryou" | "following" | "discover";
}

export function FeedPostList({ feedType = "foryou" }: FeedPostListProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useFeedPosts(feedType);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentryRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(handleObserver, {
      threshold: 0,
      rootMargin: "200px",
    });

    if (sentryRef.current) {
      observerRef.current.observe(sentryRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [handleObserver]);

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <FeedPostSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="border-border bg-card flex flex-col items-center justify-center overflow-hidden border-[0.5px] py-12 max-sm:rounded-none max-sm:border-x-0 sm:rounded-xl">
        <p className="text-muted-foreground text-sm">Failed to load feed</p>
        <button
          onClick={() => window.location.reload()}
          className="text-brand mt-2 text-sm font-medium hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    const emptyMessages: Record<string, { title: string; subtitle: string }> = {
      following: {
        title: "No posts from people you follow",
        subtitle: "Follow creators in the Discover tab to see their posts here!",
      },
      discover: {
        title: "No trending posts right now",
        subtitle: "Check back soon — new content is always being shared!",
      },
      foryou: {
        title: "No posts yet",
        subtitle: "Be the first to share something with the community!",
      },
    };

    const msg = emptyMessages[feedType] ?? emptyMessages.foryou;

    return (
      <div className="border-border bg-card flex flex-col items-center justify-center overflow-hidden border-[0.5px] py-16 max-sm:rounded-none max-sm:border-x-0 sm:rounded-xl">
        <p className="text-foreground text-base font-semibold">{msg.title}</p>
        <p className="text-muted-foreground mt-1 text-sm">{msg.subtitle}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <FeedPostCard key={post.id} post={post} />
      ))}

      {/* Infinite scroll sentry */}
      <div ref={sentryRef} className="h-1" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="text-brand h-6 w-6 animate-spin" />
        </div>
      )}

      {!hasNextPage && posts.length > 5 && (
        <p className="text-muted-foreground py-6 text-center text-sm">
          You&apos;re all caught up! 🎉
        </p>
      )}
    </div>
  );
}

function FeedPostSkeleton() {
  return (
    <div className="border-border bg-card animate-pulse overflow-hidden border-[0.5px] max-sm:rounded-none max-sm:border-x-0 sm:rounded-xl">
      {/* Header */}
      <div className="flex items-start gap-2 px-4 pt-3 pb-2">
        <div className="border-muted flex h-[42px] w-[42px] items-center justify-center rounded-full border-2 p-[1px]">
          <div className="bg-muted h-full w-full rounded-full" />
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="bg-muted h-3.5 w-32 rounded" />
          <div className="bg-muted h-3 w-20 rounded" />
        </div>
      </div>
      {/* Body */}
      <div className="space-y-2 px-4 pb-2">
        <div className="bg-muted h-3.5 rounded" />
        <div className="bg-muted h-3.5 w-4/5 rounded" />
        <div className="bg-muted h-3.5 w-3/5 rounded" />
      </div>
      {/* Media */}
      <div className="bg-muted aspect-[4/5]" />
      {/* Reactions bar */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="bg-muted h-[18px] w-[18px] rounded-full" />
          <div className="bg-muted h-3 w-8 rounded" />
        </div>
        <div className="bg-muted h-3 w-20 rounded" />
      </div>
      {/* Action bar */}
      <div className="bg-border mx-4 h-px" />
      <div className="flex gap-2 px-2 py-2">
        <div className="bg-muted h-8 flex-1 rounded-lg" />
        <div className="bg-muted h-8 flex-1 rounded-lg" />
        <div className="bg-muted h-8 flex-1 rounded-lg" />
      </div>
      {/* Comment input */}
      <div className="bg-border mx-4 h-px" />
      <div className="flex items-center gap-2 px-4 py-2 pb-3">
        <div className="bg-muted h-8 w-8 rounded-full" />
        <div className="bg-muted h-9 flex-1 rounded-[20px]" />
      </div>
    </div>
  );
}
