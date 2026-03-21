"use client";

import { useRef, useCallback, useEffect } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { PostCard } from "@/components/blog/PostCard";
import type { PostCardData } from "@/components/blog/PostCard";
import { getPostUrl } from "@/lib/urls";

interface ApiPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: string;
  views: number;
  type: string;
  category: { name: string; slug: string } | null;
  author: { name: string; image: string | null } | null;
}

interface PostsResponse {
  posts: ApiPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
  };
}

interface GistInfiniteGridProps {
  initialPosts: PostCardData[];
  initialHasNext: boolean;
  permalinkStructure: string;
}

function mapApiPost(p: ApiPost, permalinkStructure: string): PostCardData {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    coverImage: p.coverImage,
    publishedAt: p.publishedAt,
    viewCount: p.views,
    category: p.category,
    author: p.author?.name ? { name: p.author.name, avatar: p.author.image } : null,
    href: getPostUrl(p, permalinkStructure),
  };
}

export function GistInfiniteGrid({
  initialPosts,
  initialHasNext,
  permalinkStructure,
}: GistInfiniteGridProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery<{
    posts: PostCardData[];
    hasNext: boolean;
  }>({
    queryKey: ["gist-infinite"],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        type: "GIST",
        limit: "12",
        page: String(pageParam),
      });
      const { data } = await axios.get<PostsResponse>(`/api/posts?${params}`);
      return {
        posts: data.posts.map((p) => mapApiPost(p, permalinkStructure)),
        hasNext: data.pagination.hasNext,
      };
    },
    initialPageParam: 2, // page 1 data is passed as initialPosts
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.hasNext ? (lastPageParam as number) + 1 : undefined,
    initialData: {
      pages: [{ posts: initialPosts, hasNext: initialHasNext }],
      pageParams: [1],
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
        icon={MessageCircle}
        title="No gist yet"
        description="The latest entertainment gist and celebrity news will land here. Stay tuned!"
        actionLabel="Browse News"
        actionHref="/news"
      />
    );
  }

  return (
    <>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {allPosts.map((post, i) => (
          <div key={post.id} className="mb-4 break-inside-avoid">
            <PostCard post={post} hideExcerpt={i % 3 === 1} />
          </div>
        ))}
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
      {!hasNextPage && allPosts.length > 0 && (
        <div className="py-10 text-center">
          <p className="text-muted-foreground text-sm font-medium">
            You&apos;ve caught up! That&apos;s all the gist for now.
          </p>
        </div>
      )}
    </>
  );
}
