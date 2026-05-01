"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { LayoutGrid, List, Loader2, Eye, Heart } from "lucide-react";
import { motion, LayoutGroup, AnimatePresence, type Transition } from "motion/react";
import { useSession } from "next-auth/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { cn, formatRelativeDate } from "@/lib/utils";
import { notify } from "@/hooks/useToast";
import { useFavoriteCheck } from "@/hooks/useUserDashboard";
import { useToggleFavorite } from "@/hooks/useUserMutations";
import { PostImage } from "./PostImage";
import type { PostCardData } from "./PostCard";
import { MorphingTitle } from "./MorphingTitle";

type ViewMode = "grid" | "list";

const STORAGE_KEY = "soundloaded:feed-view";

const snappySpring: Transition = {
  type: "spring",
  stiffness: 350,
  damping: 30,
  mass: 1,
};

const fastFade: Transition = {
  duration: 0.15,
  ease: "linear",
};

interface FeedViewToggleProps {
  posts: PostCardData[];
  category?: string;
  type?: string;
  initialPage?: number;
  postsPerPage?: number;
  totalPages?: number;
}

interface PageResponse {
  posts: PostCardData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
  };
}

/* ━━━ Animated Tab Pill ━━━ */
function ViewTab({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all outline-none",
        active ? "text-background" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {active && (
        <motion.div
          layoutId="feed-active-tab"
          className="bg-foreground absolute inset-0 rounded-full"
          transition={snappySpring}
        />
      )}
      <span className="relative z-10 flex items-center gap-1.5">
        <Icon
          className={cn("h-3.5 w-3.5 transition-transform duration-300", active && "scale-110")}
        />
        <span className="hidden sm:inline">{label}</span>
      </span>
    </button>
  );
}

/* ━━━ Card Love Button ━━━ */
function CardLoveButton({ postId, className }: { postId: string; className?: string }) {
  const { status } = useSession();
  const { data: checkData } = useFavoriteCheck(postId, undefined);
  const toggleFavorite = useToggleFavorite();
  const isFavorited = checkData?.favorited ?? false;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (status !== "authenticated") {
      notify.error("Sign in to save to your library");
      return;
    }
    toggleFavorite.mutate({
      postId,
      favoriteId: checkData?.favoriteId,
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={toggleFavorite.isPending}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-full bg-black/50 backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-black/70 active:scale-95",
        isFavorited && "bg-red-500/80 hover:bg-red-500",
        className
      )}
      aria-label={isFavorited ? "Remove from library" : "Save to library"}
    >
      <Heart
        className={cn(
          "h-3.5 w-3.5 transition-colors",
          isFavorited ? "fill-white text-white" : "text-white/80"
        )}
      />
    </button>
  );
}

/* ━━━ Grid Card ━━━ */
function SpotifyCard({ post }: { post: PostCardData }) {
  const href = post.href || `/${post.slug}`;

  return (
    <Link href={href} className="group block">
      <motion.div
        layout
        transition={snappySpring}
        className="bg-card/40 hover:bg-card rounded-xl p-2.5 transition-colors duration-200 sm:p-3"
      >
        {/* Square cover image */}
        <div className="relative aspect-square w-full overflow-hidden rounded-lg">
          <PostImage
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            category={post.category?.name}
            author={post.author?.name}
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />

          {/* Category pill — top left */}
          {post.category && (
            <div className="absolute top-2 left-2">
              <span className="rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-bold tracking-wide text-white uppercase backdrop-blur-md">
                {post.category.name}
              </span>
            </div>
          )}

          {/* Love button — bottom left */}
          <div className="absolute bottom-2 left-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <CardLoveButton postId={post.id} />
          </div>

          {/* Views — bottom right */}
          {post.viewCount !== undefined && post.viewCount > 0 && (
            <div className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-md">
              <Eye className="h-3 w-3" />
              {post.viewCount.toLocaleString()}
            </div>
          )}
        </div>

        {/* Title + date below */}
        <div className="mt-2.5 min-w-0 px-0.5">
          <h3 className="text-foreground group-hover:text-brand line-clamp-2 text-[13px] leading-snug font-bold transition-colors sm:text-sm">
            {post.title}
          </h3>
          <p className="text-muted-foreground mt-1 truncate text-[11px]">
            {formatRelativeDate(post.publishedAt)}
          </p>
        </div>
      </motion.div>
    </Link>
  );
}

/* ━━━ List Card ━━━ */
function ListCard({ post }: { post: PostCardData }) {
  const href = post.href || `/${post.slug}`;

  return (
    <Link href={href} className="group block">
      <motion.div
        layout
        transition={snappySpring}
        className="bg-card/30 hover:bg-card border-border/30 hover:border-border/50 flex overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-md"
      >
        {/* Thumbnail — flush to left edge, fixed square, left-side radius */}
        <div className="relative aspect-square w-28 shrink-0 overflow-hidden sm:w-32">
          <PostImage
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover object-center transition-transform duration-500 group-hover:scale-110"
            sizes="128px"
            category={post.category?.name}
            author={post.author?.name}
          />
          <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />

          {/* Views — bottom right on thumbnail */}
          {post.viewCount !== undefined && post.viewCount > 0 && (
            <div className="absolute right-1.5 bottom-1.5 flex items-center gap-0.5 rounded-full bg-black/50 px-1.5 py-0.5 text-[9px] font-medium text-white/90 backdrop-blur-md">
              <Eye className="h-2.5 w-2.5" />
              {post.viewCount.toLocaleString()}
            </div>
          )}

          {/* Love — bottom left on thumbnail */}
          <div className="absolute bottom-1.5 left-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <CardLoveButton postId={post.id} className="h-6 w-6" />
          </div>
        </div>

        {/* Info */}
        <div className="flex min-w-0 flex-1 flex-col justify-center px-3.5 py-3 sm:px-4 sm:py-3.5">
          {post.category && (
            <span className="text-brand mb-1 text-[10px] font-bold tracking-wide uppercase">
              {post.category.name}
            </span>
          )}
          <h3 className="text-foreground group-hover:text-brand line-clamp-2 text-sm leading-snug font-bold transition-colors sm:text-[15px]">
            {post.title}
          </h3>
          <div className="text-muted-foreground mt-1.5 flex items-center gap-2 text-[11px]">
            {post.author && <span className="font-medium">{post.author.name}</span>}
            <span className="opacity-60">{formatRelativeDate(post.publishedAt)}</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

/* ━━━ Main Component ━━━ */
export function FeedViewToggle({
  posts: initialPosts,
  category,
  type,
  initialPage = 1,
  postsPerPage = 20,
  totalPages = 1,
}: FeedViewToggleProps) {
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

  // Page-based infinite scroll
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery<PageResponse>({
    queryKey: ["homepage-posts", category, type, initialPage],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        limit: String(postsPerPage),
        page: String(pageParam),
      });
      if (category) params.set("category", category);
      if (type) params.set("type", type);
      const { data } = await axios.get<PageResponse>(`/api/posts?${params}`);
      return data;
    },
    initialPageParam: initialPage + 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      return lastPage.pagination.hasNext ? (lastPageParam as number) + 1 : undefined;
    },
    initialData: {
      pages: [
        {
          posts: initialPosts,
          pagination: {
            page: initialPage,
            limit: postsPerPage,
            total: totalPages * postsPerPage,
            totalPages,
            hasNext: initialPage < totalPages,
          },
        },
      ],
      pageParams: [initialPage + 1],
    },
    staleTime: 60_000,
  });

  // Intersection observer — fires 800px before sentry enters viewport
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
    const observer = new IntersectionObserver(handleIntersect, { rootMargin: "800px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  const posts = data?.pages.flatMap((p) => p.posts) ?? initialPosts;

  return (
    <div>
      {/* Section header */}
      <div className="mb-4 flex items-center justify-between">
        <MorphingTitle />

        <div className="flex items-center gap-2">
          {/* Animated pill tabs */}
          <LayoutGroup id="feed-tabs">
            <div className="bg-muted/60 border-border/50 flex rounded-full border p-0.5">
              <ViewTab
                active={view === "grid"}
                onClick={() => toggle("grid")}
                icon={LayoutGrid}
                label="Grid"
              />
              <ViewTab
                active={view === "list"}
                onClick={() => toggle("list")}
                icon={List}
                label="List"
              />
            </div>
          </LayoutGroup>

          <Link
            href="/news"
            className="bg-muted/60 text-muted-foreground hover:bg-brand/10 hover:text-brand border-border/50 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors"
          >
            View all
          </Link>
        </div>
      </div>

      <LayoutGroup id="feed-posts">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={view}
            layout
            initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
            transition={fastFade}
            className={cn(
              view === "grid"
                ? "grid grid-cols-2 gap-1 sm:grid-cols-3 sm:gap-2 lg:grid-cols-4"
                : "grid grid-cols-1 gap-3 sm:grid-cols-2"
            )}
          >
            {posts.map((post) =>
              view === "grid" ? (
                <SpotifyCard key={post.id} post={post} />
              ) : (
                <ListCard key={post.id} post={post} />
              )
            )}
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>

      {/* Infinite scroll sentry */}
      <div ref={sentryRef} className="py-4 text-center">
        {isFetchingNextPage && (
          <Loader2 className="text-muted-foreground mx-auto h-6 w-6 animate-spin" />
        )}
        {!hasNextPage && posts.length > postsPerPage && (
          <p className="text-muted-foreground text-sm">You&apos;re all caught up!</p>
        )}
      </div>
    </div>
  );
}
