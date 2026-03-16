"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Plus, ChevronRight } from "lucide-react";
import { useStories } from "@/hooks/useStories";
import { StoryTraySkeleton } from "./StoryTraySkeleton";
import { StoriesPlayer } from "./StoriesConfig";
import { StoriesDialog } from "./StoriesDialog";
import { StoryCreateDialog } from "./StoryCreateDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import "./stories.css";

const BATCH_SIZE = 8;
const SCROLL_AMOUNT = 300;

interface StoryTrayProps {
  className?: string;
  enableStories?: boolean;
}

export function StoryTray({ className, enableStories = true }: StoryTrayProps) {
  const { data: session, status } = useSession();
  const { data: storyGroups, isLoading } = useStories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  // Progressive loading
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentryRef = useRef<HTMLDivElement>(null);

  // Scroll nav state
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState, storyGroups, visibleCount]);

  // Intersection observer for lazy loading more stories
  useEffect(() => {
    const sentry = sentryRef.current;
    if (!sentry) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoadingMore) {
          const totalGroups = storyGroups?.length ?? 0;
          if (visibleCount < totalGroups) {
            setIsLoadingMore(true);
            // Brief delay for skeleton visibility
            setTimeout(() => {
              setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, totalGroups));
              setIsLoadingMore(false);
            }, 400);
          }
        }
      },
      { root: scrollRef.current, rootMargin: "100px", threshold: 0 }
    );

    observer.observe(sentry);
    return () => observer.disconnect();
  }, [visibleCount, storyGroups, isLoadingMore]);

  const scrollBy = (direction: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: direction === "right" ? SCROLL_AMOUNT : -SCROLL_AMOUNT,
      behavior: "smooth",
    });
  };

  if (!enableStories) return null;
  if (isLoading) return <StoryTraySkeleton />;

  const groups = storyGroups ?? [];
  const visibleGroups = groups.slice(0, visibleCount);
  const hasMore = visibleCount < groups.length;

  return (
    <>
      <div className={cn("group/tray relative", className)}>
        {/* Prev button */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollBy("left")}
            className="border-border/60 bg-card hover:bg-muted absolute top-1/2 left-1 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border shadow-lg transition-colors active:scale-95 max-sm:hidden"
            aria-label="Previous items"
          >
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="currentColor"
              className="text-secondary-foreground"
            >
              <path d="M14.791 5.207 8 12l6.791 6.793a1 1 0 1 1-1.415 1.414l-7.5-7.5a1 1 0 0 1 0-1.414l7.5-7.5a1 1 0 1 1 1.415 1.414z" />
            </svg>
          </button>
        )}

        {/* Next button */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollBy("right")}
            className="border-border/60 bg-card hover:bg-muted absolute top-1/2 right-1 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border shadow-lg transition-colors active:scale-95 max-sm:hidden"
            aria-label="Next items"
          >
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="currentColor"
              className="text-secondary-foreground"
            >
              <path d="M9.209 5.207 16 12l-6.791 6.793a1 1 0 1 0 1.415 1.414l7.5-7.5a1 1 0 0 0 0-1.414l-7.5-7.5a1 1 0 1 0-1.415 1.414z" />
            </svg>
          </button>
        )}

        {/* Scrollable tray */}
        <div
          ref={scrollRef}
          className="scrollbar-hide flex items-stretch gap-2 overflow-x-auto py-2 sm:px-6"
          role="list"
          aria-label="Stories"
        >
          {/* Create Story card */}
          {status === "authenticated" ? (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="story-create-card group relative flex-shrink-0 overflow-hidden rounded-xl"
              role="listitem"
              aria-label="Create a story"
            >
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt=""
                  fill
                  className="object-cover brightness-75 transition-all group-hover:scale-105 group-hover:brightness-90"
                />
              ) : (
                <div className="bg-muted absolute inset-0" />
              )}
              <div className="relative z-[1] flex h-full flex-col items-center justify-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-blue-500">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-semibold text-white drop-shadow-sm">
                  Create Story
                </span>
              </div>
            </button>
          ) : (
            <Link
              href="/login"
              className="story-create-card group relative flex-shrink-0 overflow-hidden rounded-xl"
              role="listitem"
            >
              <div className="bg-muted absolute inset-0" />
              <div className="relative z-[1] flex h-full flex-col items-center justify-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-blue-500">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-semibold text-white drop-shadow-sm">
                  Create Story
                </span>
              </div>
            </Link>
          )}

          {/* Story cards */}
          {visibleGroups.length > 0 && <StoriesPlayer groups={visibleGroups} />}

          {/* Loading skeletons when fetching more */}
          {isLoadingMore && (
            <>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton
                  key={`loading-${i}`}
                  className="story-create-card flex-shrink-0 rounded-xl"
                />
              ))}
            </>
          )}

          {/* Lazy load sentry — triggers loading more stories */}
          {hasMore && !isLoadingMore && (
            <div ref={sentryRef} className="flex flex-shrink-0 items-stretch">
              <div className="w-2" />
            </div>
          )}

          {/* View All card */}
          {groups.length > 0 && (
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="story-create-card bg-muted hover:bg-muted/80 flex flex-shrink-0 flex-col items-center justify-center gap-2 rounded-xl transition-colors"
              role="listitem"
              aria-label="View all stories"
            >
              <ChevronRight className="text-muted-foreground h-6 w-6" />
              <span className="text-muted-foreground text-xs font-medium">View All</span>
            </button>
          )}
        </div>
      </div>

      {/* Stories dialog (View All) */}
      <StoriesDialog open={dialogOpen} onOpenChange={setDialogOpen} storyGroups={groups} />

      {/* Story creation dialog */}
      <StoryCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
