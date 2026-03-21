"use client";

import { useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Music2, Eye, MicVocal } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { formatRelativeDate } from "@/lib/utils";
import { getPostUrl } from "@/lib/urls";
import type { PostCardData } from "@/components/blog/PostCard";

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

/* ━━━ Lyrics list card ━━━ */
function LyricsListCard({ post }: { post: PostCardData }) {
  const href = post.href || `/${post.slug}`;

  return (
    <Link
      href={href}
      className="group hover:bg-muted/50 flex items-center gap-3 rounded-xl px-3 py-3 transition-colors"
    >
      {/* Cover art — square */}
      <div className="bg-muted relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes="56px"
          />
        ) : (
          <div className="from-brand/20 to-muted flex h-full items-center justify-center bg-gradient-to-br">
            <Music2 className="text-muted-foreground/40 h-5 w-5" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="text-foreground group-hover:text-brand line-clamp-1 text-sm font-semibold transition-colors">
          {post.title}
        </p>
        {post.author && (
          <p className="text-muted-foreground mt-0.5 truncate text-[12px]">{post.author.name}</p>
        )}
        <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-[11px]">
          {post.viewCount !== undefined && post.viewCount > 0 && (
            <>
              <Eye className="h-3 w-3" />
              <span>{post.viewCount.toLocaleString()}</span>
              <span>·</span>
            </>
          )}
          <span>{formatRelativeDate(post.publishedAt)}</span>
        </div>
      </div>
    </Link>
  );
}

/* ━━━ Infinite list ━━━ */
interface LyricsInfiniteListProps {
  initialPosts: PostCardData[];
  initialHasNext: boolean;
  permalinkStructure: string;
}

export function LyricsInfiniteList({
  initialPosts,
  initialHasNext,
  permalinkStructure,
}: LyricsInfiniteListProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery<{
    posts: PostCardData[];
    hasNext: boolean;
  }>({
    queryKey: ["lyrics-infinite"],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        type: "LYRICS",
        limit: "20",
        page: String(pageParam),
      });
      const { data } = await axios.get<PostsResponse>(`/api/posts?${params}`);
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
        icon={MicVocal}
        title="No lyrics yet"
        description="Song lyrics will appear here once published. Check back soon for the latest Afrobeats lyrics!"
        actionLabel="Browse Music"
        actionHref="/music"
      />
    );
  }

  return (
    <>
      {/* Two-column list layout */}
      <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
        {allPosts.map((post) => (
          <div key={post.id} className="border-border/40 border-b">
            <LyricsListCard post={post} />
          </div>
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
            You&apos;ve caught up! That&apos;s all the lyrics for now.
          </p>
        </div>
      )}
    </>
  );
}
