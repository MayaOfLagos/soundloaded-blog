"use client";

import { useRef, useCallback, useEffect } from "react";
import { Loader2, PlaySquare } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { VideoCard } from "@/components/blog/VideoCard";
import type { PostCardData } from "@/components/blog/PostCard";

interface ApiPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: string | null;
  views: number;
  category: { name: string; slug: string } | null;
  author: { name: string | null; image: string | null };
}

interface ApiResponse {
  posts: ApiPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
  };
}

function mapApiPost(p: ApiPost, permalinkStructure: string): PostCardData {
  // For VIDEO posts, use /videos-slug or the permalink structure
  const href = permalinkStructure === "/%postname%" ? `/${p.slug}` : `/${p.slug}`;

  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    coverImage: p.coverImage,
    publishedAt: p.publishedAt ?? new Date().toISOString(),
    viewCount: p.views,
    category: p.category,
    author: p.author?.name ? { name: p.author.name, avatar: p.author.image } : null,
    href,
  };
}

interface VideosInfiniteGridProps {
  initialPosts: PostCardData[];
  initialHasNext: boolean;
  heroCount: number;
  permalinkStructure: string;
  category?: string | null;
}

export function VideosInfiniteGrid({
  initialPosts,
  initialHasNext,
  heroCount: _,
  permalinkStructure,
  category = null,
}: VideosInfiniteGridProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Page 1 was the initial server fetch (heroCount + initialPosts).
  // Next client fetch starts at page 2.
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery<{
    posts: PostCardData[];
    hasNext: boolean;
  }>({
    queryKey: ["videos-infinite", category],
    queryFn: async ({ pageParam }) => {
      let url = `/api/posts?type=VIDEO&limit=20&page=${pageParam}`;
      if (category) url += `&category=${category}`;
      const { data } = await axios.get<ApiResponse>(url);
      return {
        posts: data.posts.map((p) => mapApiPost(p, permalinkStructure)),
        hasNext: data.pagination.hasNext,
      };
    },
    initialPageParam: 2,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.hasNext ? (lastPageParam as number) + 1 : undefined,
    initialData: {
      pages: [{ posts: initialPosts, hasNext: initialHasNext }],
      pageParams: [2],
    },
  });

  const allPosts = data?.pages.flatMap((p) => p.posts) ?? [];

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

  if (!allPosts.length) {
    return (
      <EmptyState
        icon={PlaySquare}
        title="No videos yet"
        description="Music videos, interviews, and behind-the-scenes content will appear here once published."
        actionLabel="Browse Music"
        actionHref="/music"
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {allPosts.map((post) => (
          <VideoCard key={post.id} post={post} />
        ))}
      </div>

      {/* Sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-8">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </div>
      )}

      {!hasNextPage && allPosts.length > 0 && (
        <div className="py-10 text-center">
          <p className="text-muted-foreground text-sm font-medium">
            You&apos;ve caught up! That&apos;s all the videos for now.
          </p>
        </div>
      )}
    </>
  );
}
