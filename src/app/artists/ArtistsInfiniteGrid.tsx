"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mic2, BadgeCheck, Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { cn } from "@/lib/utils";
import { useArtistFollow } from "@/hooks/useArtistFollow";
import { Skeleton } from "@/components/ui/skeleton";

interface ArtistItem {
  id: string;
  slug: string;
  name: string;
  photo: string | null;
  genre: string | null;
  verified: boolean;
  songCount: number;
  albumCount: number;
  followerCount: number;
}

interface ArtistsResponse {
  artists: ArtistItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
  };
}

interface ArtistsInfiniteGridProps {
  genres: string[];
}

const SORT_OPTIONS = [
  { value: "a-z", label: "A — Z" },
  { value: "latest", label: "Recently Added" },
  { value: "popular", label: "Most Popular" },
] as const;

export function ArtistsInfiniteGrid({ genres }: ArtistsInfiniteGridProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<string>("a-z");
  const [genre, setGenre] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery<ArtistsResponse>({
      queryKey: ["artists-infinite", sort, genre, debouncedSearch],
      queryFn: async ({ pageParam }) => {
        const params = new URLSearchParams({
          limit: "20",
          sort,
          page: String(pageParam),
        });
        if (debouncedSearch) params.set("q", debouncedSearch);
        if (genre) params.set("genre", genre);
        const { data } = await axios.get<ArtistsResponse>(`/api/artists?${params}`);
        return data;
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage) =>
        lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    });

  const allArtists = data?.pages.flatMap((p) => p.artists) ?? [];
  const totalCount = data?.pages[0]?.pagination.total ?? 0;

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

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="space-y-3">
        {/* Search + Sort row */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search artists..."
              className="border-border bg-muted/50 text-foreground placeholder:text-muted-foreground focus:border-brand w-full rounded-xl border py-2.5 pr-9 pl-9 text-sm transition-colors outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border-border bg-muted/50 text-foreground focus:border-brand h-[42px] cursor-pointer appearance-none rounded-xl border pr-8 pl-3 text-sm font-medium transition-colors outline-none"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <SlidersHorizontal className="text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2" />
          </div>
        </div>

        {/* Genre chips */}
        {genres.length > 0 && (
          <div className="scrollbar-hide flex gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setGenre(null)}
              className={cn(
                "flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                genre === null
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              All
            </button>
            {genres.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGenre(genre === g ? null : g)}
                className={cn(
                  "flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  genre === g
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        {/* Results count */}
        {!isLoading && (
          <p className="text-muted-foreground text-xs">
            {totalCount} artist{totalCount !== 1 ? "s" : ""}
            {debouncedSearch && ` matching "${debouncedSearch}"`}
            {genre && ` in ${genre}`}
          </p>
        )}
      </div>

      {/* Loading */}
      {isLoading && <ArtistsGridSkeleton />}

      {/* Empty */}
      {!isLoading && !allArtists.length && (
        <EmptyState
          icon={Mic2}
          title="No artists found"
          description={
            debouncedSearch || genre
              ? "Try a different search or filter to find what you're looking for."
              : "Artists and their profiles will appear here once added to the platform."
          }
          actionLabel={debouncedSearch || genre ? undefined : "Browse Music"}
          actionHref={debouncedSearch || genre ? undefined : "/music"}
        />
      )}

      {/* Grid */}
      {!isLoading && allArtists.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {allArtists.map((artist) => (
              <ArtistGridCard key={artist.id} artist={artist} />
            ))}
          </div>

          {/* Sentinel */}
          <div ref={sentinelRef} className="h-1" />

          {/* Loading more */}
          {isFetchingNextPage && (
            <div className="flex justify-center py-8">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          )}

          {/* End */}
          {!hasNextPage && (
            <div className="py-10 text-center">
              <p className="text-muted-foreground text-sm font-medium">
                You&apos;ve caught up! That&apos;s all the artists for now.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Artist Card ──
function ArtistGridCard({ artist }: { artist: ArtistItem }) {
  return (
    <div className="group/card hover:bg-muted/50 flex flex-col items-center rounded-2xl p-4 text-center transition-colors">
      {/* Photo */}
      <Link href={`/artists/${artist.slug}`} className="relative mb-3">
        <div className="bg-muted ring-border group-hover/card:ring-brand/50 relative h-28 w-28 overflow-hidden rounded-full ring-2 transition-all sm:h-32 sm:w-32">
          {artist.photo ? (
            <Image
              src={artist.photo}
              alt={artist.name}
              fill
              className="object-cover transition-transform duration-300 group-hover/card:scale-105"
              sizes="128px"
            />
          ) : (
            <div className="from-brand/10 to-muted flex h-full w-full items-center justify-center bg-gradient-to-br">
              <Mic2 className="text-muted-foreground/40 h-10 w-10" />
            </div>
          )}
        </div>

        {/* Verified badge on photo */}
        {artist.verified && (
          <div className="bg-background absolute -right-0.5 bottom-1 rounded-full p-0.5">
            <BadgeCheck className="h-5 w-5 fill-blue-500 text-white" />
          </div>
        )}
      </Link>

      {/* Name */}
      <Link href={`/artists/${artist.slug}`} className="w-full min-w-0">
        <p className="text-foreground group-hover/card:text-brand truncate text-sm font-bold transition-colors">
          {artist.name}
        </p>
      </Link>

      {/* Follower count */}
      {artist.followerCount > 0 && (
        <p className="text-muted-foreground mt-1 text-[11px]">
          {artist.followerCount.toLocaleString()} follower{artist.followerCount !== 1 ? "s" : ""}
        </p>
      )}

      {/* Follow button */}
      <div className="mt-2.5 w-full" onClick={(e) => e.stopPropagation()}>
        <FollowButton artistId={artist.id} />
      </div>
    </div>
  );
}

// ── Follow Button ──
function FollowButton({ artistId }: { artistId: string }) {
  const { isFollowing, isPending, toggle } = useArtistFollow(artistId, {
    surface: "FOLLOW_SUGGESTIONS",
    placement: "artists_grid_card",
  });
  const [isHovering, setIsHovering] = useState(false);

  const showUnfollow = isFollowing && isHovering;

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={toggle}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={cn(
        "w-full rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
        isFollowing
          ? showUnfollow
            ? "border-destructive/50 text-destructive hover:bg-destructive/10 border"
            : "border-brand/30 text-brand bg-brand/10 border"
          : "border-border text-foreground hover:border-brand hover:text-brand border"
      )}
    >
      {isPending ? (
        <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" />
      ) : showUnfollow ? (
        "Unfollow"
      ) : isFollowing ? (
        "Following"
      ) : (
        "Follow"
      )}
    </button>
  );
}

// ── Skeleton ──
export function ArtistsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center rounded-2xl p-4">
          <Skeleton className="mb-3 h-28 w-28 rounded-full sm:h-32 sm:w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-1.5 h-3 w-16" />
          <Skeleton className="mt-1.5 h-3 w-20" />
          <Skeleton className="mt-2.5 h-7 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}
