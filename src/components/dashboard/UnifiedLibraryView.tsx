"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import {
  Library,
  Bookmark,
  Heart,
  Download,
  Music,
  X,
  Grid3X3,
  List,
  BookOpen,
  EyeOff,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  useUserLibrary,
  useUserBookmarks,
  useUserFavorites,
  useUserDownloads,
  useUserStats,
} from "@/hooks/useUserDashboard";
import { useToggleBookmark, useToggleFavorite } from "@/hooks/useUserMutations";
import { useUserHiddenPosts, useToggleHiddenPost } from "@/hooks/useHiddenPosts";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { LibraryTabBar } from "./LibraryTabBar";
import axios from "axios";

// ── Types ──────────────────────────────────────────────────────────────

interface LibraryItem {
  id: string;
  title?: string;
  slug?: string;
  type: string;
  coverImage?: string;
  coverArt?: string;
  savedAs: string;
  savedAt: string;
}

interface BookmarkItem {
  id: string;
  post?: { slug: string; title: string; coverImage?: string };
  music?: { slug: string; title: string; coverArt?: string };
  createdAt: string;
}

interface FavoriteItem {
  id: string;
  post?: { coverImage?: string; slug: string; title: string };
  music?: { coverArt?: string; slug: string; title: string };
  createdAt: string;
}

interface DownloadItem {
  id: string;
  musicId: string;
  createdAt: string;
  music?: {
    coverImage?: string;
    coverArt?: string;
    title?: string;
    artist?: { name?: string };
  };
}

// ── Helpers ────────────────────────────────────────────────────────────

function getSavedAsBadge(savedAs: string) {
  switch (savedAs) {
    case "bookmarked":
      return (
        <Badge className="border-blue-200 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">
          Bookmarked
        </Badge>
      );
    case "favorited":
      return (
        <Badge className="border-pink-200 bg-pink-500/10 text-pink-600 hover:bg-pink-500/20">
          Favorited
        </Badge>
      );
    case "both":
      return (
        <Badge className="border-purple-200 bg-purple-500/10 text-purple-600 hover:bg-purple-500/20">
          Both
        </Badge>
      );
    default:
      return null;
  }
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </Button>
      <span className="text-muted-foreground text-sm">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}

function FilterBar({
  tabs,
  activeTab,
  onTabChange,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
}: {
  tabs: { value: string; label: string }[];
  activeTab: string;
  onTabChange: (v: string) => void;
  sort: "newest" | "oldest";
  onSortChange: (s: "newest" | "oldest") => void;
  viewMode: "grid" | "list";
  onViewModeChange: (m: "grid" | "list") => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      {/* Horizontal scroll on mobile, vertical stack on desktop */}
      <div className="scrollbar-hide flex gap-1 overflow-x-auto sm:flex-col sm:gap-0.5">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => onTabChange(t.value)}
            className={cn(
              "rounded-lg px-3 py-2 text-left text-sm font-medium whitespace-nowrap transition-colors",
              activeTab === t.value
                ? "bg-brand/10 text-brand font-semibold"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as "newest" | "oldest")}
          className="bg-background rounded-md border px-3 py-2 text-sm"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
        <Button
          variant={viewMode === "grid" ? "default" : "ghost"}
          size="icon"
          onClick={() => onViewModeChange("grid")}
        >
          <Grid3X3 className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === "list" ? "default" : "ghost"}
          size="icon"
          onClick={() => onViewModeChange("list")}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: typeof BookOpen;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="text-muted-foreground mb-4 h-12 w-12" />
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      <Button asChild className="mt-4">
        <Link href={actionHref}>{actionLabel}</Link>
      </Button>
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filter bar skeleton: vertical tabs left + sort/view right */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-1 sm:flex-col sm:gap-0.5">
          <Skeleton className="h-9 w-14 rounded-lg" />
          <Skeleton className="h-9 w-16 rounded-lg" />
          <Skeleton className="h-9 w-14 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </div>
      {/* Content grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-card/50 ring-border/40 overflow-hidden rounded-2xl ring-1 backdrop-blur-sm"
          >
            <Skeleton className="h-[150px] w-full" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-5 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-14" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────

const SAVED_TABS = [
  { value: "all", label: "All" },
  { value: "music", label: "Music" },
  { value: "news", label: "News" },
  { value: "gist", label: "Gist" },
  { value: "videos", label: "Videos" },
];

const BM_FAV_TABS = [
  { value: "", label: "All" },
  { value: "post", label: "Posts" },
  { value: "music", label: "Music" },
];

export function UnifiedLibraryView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab") ?? "saved";
  const activeTab = ["saved", "bookmarks", "favorites", "downloads", "hidden"].includes(urlTab)
    ? urlTab
    : "saved";

  // ── Per-tab state (persists across tab switches) ──
  const [savedPage, setSavedPage] = useState(1);
  const [savedTab, setSavedTab] = useState("all");
  const [savedSort, setSavedSort] = useState<"newest" | "oldest">("newest");
  const [savedViewMode, setSavedViewMode] = useState<"grid" | "list">("grid");

  const [bmPage, setBmPage] = useState(1);
  const [bmType, setBmType] = useState("");
  const [bmSort, setBmSort] = useState<"newest" | "oldest">("newest");
  const [bmViewMode, setBmViewMode] = useState<"grid" | "list">("grid");

  const [favPage, setFavPage] = useState(1);
  const [favType, setFavType] = useState("");
  const [favSort, setFavSort] = useState<"newest" | "oldest">("newest");
  const [favViewMode, setFavViewMode] = useState<"grid" | "list">("grid");

  const [dlPage, setDlPage] = useState(1);

  const [hiddenPage, setHiddenPage] = useState(1);

  // ── All hooks at top level ──
  const libraryQuery = useUserLibrary(savedPage, savedTab, savedSort);
  const bookmarksQuery = useUserBookmarks(bmPage, bmType || undefined, bmSort);
  const favoritesQuery = useUserFavorites(favPage, favType || undefined, favSort);
  const downloadsQuery = useUserDownloads(dlPage);
  const hiddenPostsQuery = useUserHiddenPosts(hiddenPage);
  const statsQuery = useUserStats();
  const toggleBookmark = useToggleBookmark();
  const toggleFavorite = useToggleFavorite();
  const toggleHiddenPost = useToggleHiddenPost();

  const handleTabChange = useCallback(
    (tab: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === "saved") {
        params.delete("tab");
      } else {
        params.set("tab", tab);
      }
      const qs = params.toString();
      router.replace(`/library${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleRedownload = async (musicId: string) => {
    try {
      const { data } = await axios.post(`/api/music/${musicId}/download`);
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch {
      // silently handled
    }
  };

  // ── Tab content renderers ──

  const renderSavedTab = () => {
    if (libraryQuery.isLoading) return <ContentSkeleton />;

    const items = (libraryQuery.data?.items ?? []) as unknown as LibraryItem[];
    const totalPages = libraryQuery.data?.totalPages ?? 1;

    return (
      <div className="space-y-6">
        <FilterBar
          tabs={SAVED_TABS}
          activeTab={savedTab}
          onTabChange={(v) => {
            setSavedTab(v);
            setSavedPage(1);
          }}
          sort={savedSort}
          onSortChange={(s) => {
            setSavedSort(s);
            setSavedPage(1);
          }}
          viewMode={savedViewMode}
          onViewModeChange={setSavedViewMode}
        />

        {items.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Your library is empty"
            description="Bookmark or favorite content to build your personal library."
            actionLabel="Browse content"
            actionHref="/"
          />
        ) : (
          <>
            <div
              className={
                savedViewMode === "grid"
                  ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                  : "flex flex-col gap-3"
              }
            >
              {items.map((item) => {
                const coverSrc = item.coverImage || item.coverArt;
                const href = item.type === "music" ? `/music/${item.slug}` : `/${item.slug}`;

                return savedViewMode === "grid" ? (
                  <div
                    key={item.id}
                    className="bg-card/50 ring-border/40 group overflow-hidden rounded-2xl ring-1 backdrop-blur-sm"
                  >
                    <div className="bg-muted relative h-[150px] w-full overflow-hidden">
                      {coverSrc ? (
                        <Image
                          src={coverSrc}
                          alt={item.title ?? ""}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Library className="text-muted-foreground h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <Link href={href} className="hover:underline">
                        <h3 className="line-clamp-2 font-medium">{item.title}</h3>
                      </Link>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {item.type}
                        </Badge>
                        {getSavedAsBadge(item.savedAs)}
                        <span className="text-muted-foreground text-xs">
                          {format(new Date(item.savedAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    key={item.id}
                    className="bg-card/50 ring-border/40 group overflow-hidden rounded-2xl ring-1 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-4 p-4">
                      <div className="bg-muted relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                        {coverSrc ? (
                          <Image
                            src={coverSrc}
                            alt={item.title ?? ""}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Library className="text-muted-foreground h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link href={href} className="hover:underline">
                          <h3 className="truncate font-medium">{item.title}</h3>
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {item.type}
                          </Badge>
                          {getSavedAsBadge(item.savedAs)}
                          <span className="text-muted-foreground text-xs">
                            {format(new Date(item.savedAt), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <Pagination page={savedPage} totalPages={totalPages} onPageChange={setSavedPage} />
          </>
        )}
      </div>
    );
  };

  const renderBookmarksTab = () => {
    if (bookmarksQuery.isLoading) return <ContentSkeleton />;

    const bookmarks = (bookmarksQuery.data?.bookmarks ?? []) as unknown as BookmarkItem[];
    const totalPages = bookmarksQuery.data?.totalPages ?? 1;

    return (
      <div className="space-y-6">
        <FilterBar
          tabs={BM_FAV_TABS}
          activeTab={bmType}
          onTabChange={(v) => {
            setBmType(v);
            setBmPage(1);
          }}
          sort={bmSort}
          onSortChange={(s) => {
            setBmSort(s);
            setBmPage(1);
          }}
          viewMode={bmViewMode}
          onViewModeChange={setBmViewMode}
        />

        {bookmarks.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No bookmarks yet"
            description="Save articles and music to read or listen later."
            actionLabel="Browse content"
            actionHref="/"
          />
        ) : (
          <>
            <div
              className={
                bmViewMode === "grid"
                  ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                  : "flex flex-col gap-3"
              }
            >
              {bookmarks.map((bookmark) => {
                const item = bookmark.post || bookmark.music;
                const itemType = bookmark.post ? "Post" : "Music";
                const coverSrc = bookmark.post?.coverImage || bookmark.music?.coverArt;
                const href = bookmark.post
                  ? `/${bookmark.post.slug}`
                  : `/music/${bookmark.music?.slug}`;

                return bmViewMode === "grid" ? (
                  <div
                    key={bookmark.id}
                    className="bg-card/50 ring-border/40 group overflow-hidden rounded-2xl ring-1 backdrop-blur-sm"
                  >
                    <div className="bg-muted relative h-[150px] w-full overflow-hidden">
                      {coverSrc ? (
                        <Image
                          src={coverSrc}
                          alt={item?.title ?? ""}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Bookmark className="text-muted-foreground h-8 w-8" />
                        </div>
                      )}
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => toggleBookmark.mutate({ bookmarkId: bookmark.id })}
                        disabled={toggleBookmark.isPending}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="p-4">
                      <Link href={href} className="hover:underline">
                        <h3 className="line-clamp-2 font-medium">{item?.title}</h3>
                      </Link>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant={itemType === "Post" ? "default" : "secondary"}>
                          {itemType}
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          {format(new Date(bookmark.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    key={bookmark.id}
                    className="bg-card/50 ring-border/40 group overflow-hidden rounded-2xl ring-1 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-4 p-4">
                      <div className="bg-muted relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                        {coverSrc ? (
                          <Image
                            src={coverSrc}
                            alt={item?.title ?? ""}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Bookmark className="text-muted-foreground h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link href={href} className="hover:underline">
                          <h3 className="truncate font-medium">{item?.title}</h3>
                        </Link>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge
                            variant={itemType === "Post" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {itemType}
                          </Badge>
                          <span className="text-muted-foreground text-xs">
                            {format(new Date(bookmark.createdAt), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0"
                        onClick={() => toggleBookmark.mutate({ bookmarkId: bookmark.id })}
                        disabled={toggleBookmark.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            <Pagination page={bmPage} totalPages={totalPages} onPageChange={setBmPage} />
          </>
        )}
      </div>
    );
  };

  const renderFavoritesTab = () => {
    if (favoritesQuery.isLoading) return <ContentSkeleton />;

    const favorites = (favoritesQuery.data?.favorites ?? []) as unknown as FavoriteItem[];
    const totalPages = favoritesQuery.data?.totalPages ?? 1;

    return (
      <div className="space-y-6">
        <FilterBar
          tabs={BM_FAV_TABS}
          activeTab={favType}
          onTabChange={(v) => {
            setFavType(v);
            setFavPage(1);
          }}
          sort={favSort}
          onSortChange={(s) => {
            setFavSort(s);
            setFavPage(1);
          }}
          viewMode={favViewMode}
          onViewModeChange={setFavViewMode}
        />

        {favorites.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="No favorites yet"
            description="Mark your favorite articles and music to find them quickly."
            actionLabel="Browse content"
            actionHref="/"
          />
        ) : (
          <>
            <div
              className={
                favViewMode === "grid"
                  ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                  : "flex flex-col gap-3"
              }
            >
              {favorites.map((favorite) => {
                const item = favorite.post || favorite.music;
                const itemType = favorite.post ? "Post" : "Music";
                const coverSrc = favorite.post?.coverImage || favorite.music?.coverArt;
                const href = favorite.post
                  ? `/${favorite.post.slug}`
                  : `/music/${favorite.music?.slug}`;

                return favViewMode === "grid" ? (
                  <div
                    key={favorite.id}
                    className="bg-card/50 ring-border/40 group overflow-hidden rounded-2xl ring-1 backdrop-blur-sm"
                  >
                    <div className="bg-muted relative h-[150px] w-full overflow-hidden">
                      {coverSrc ? (
                        <Image
                          src={coverSrc}
                          alt={item?.title ?? ""}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Heart className="text-muted-foreground h-8 w-8" />
                        </div>
                      )}
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => toggleFavorite.mutate({ favoriteId: favorite.id })}
                        disabled={toggleFavorite.isPending}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="p-4">
                      <Link href={href} className="hover:underline">
                        <h3 className="line-clamp-2 font-medium">{item?.title}</h3>
                      </Link>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant={itemType === "Post" ? "default" : "secondary"}>
                          {itemType}
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          {format(new Date(favorite.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    key={favorite.id}
                    className="bg-card/50 ring-border/40 group overflow-hidden rounded-2xl ring-1 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-4 p-4">
                      <div className="bg-muted relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                        {coverSrc ? (
                          <Image
                            src={coverSrc}
                            alt={item?.title ?? ""}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Heart className="text-muted-foreground h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link href={href} className="hover:underline">
                          <h3 className="truncate font-medium">{item?.title}</h3>
                        </Link>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge
                            variant={itemType === "Post" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {itemType}
                          </Badge>
                          <span className="text-muted-foreground text-xs">
                            {format(new Date(favorite.createdAt), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0"
                        onClick={() => toggleFavorite.mutate({ favoriteId: favorite.id })}
                        disabled={toggleFavorite.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            <Pagination page={favPage} totalPages={totalPages} onPageChange={setFavPage} />
          </>
        )}
      </div>
    );
  };

  const renderDownloadsTab = () => {
    const stats = statsQuery.data;
    const statsLoading = statsQuery.isLoading;
    const downloads = (downloadsQuery.data?.downloads ?? []) as unknown as DownloadItem[];
    const totalPages = downloadsQuery.data?.totalPages ?? 1;

    return (
      <div className="space-y-6">
        {/* Stats Header */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card/50 ring-border/40 rounded-2xl p-4 ring-1 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="bg-brand/10 flex h-10 w-10 items-center justify-center rounded-xl">
                <Download className="text-brand h-5 w-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Total Downloads</p>
                {statsLoading ? (
                  <Skeleton className="mt-1 h-6 w-12" />
                ) : (
                  <p className="text-foreground text-xl font-black">{stats?.totalDownloads ?? 0}</p>
                )}
              </div>
            </div>
          </div>
          <div className="bg-card/50 ring-border/40 rounded-2xl p-4 ring-1 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="bg-brand/10 flex h-10 w-10 items-center justify-center rounded-xl">
                <Download className="text-brand h-5 w-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">This Month</p>
                {statsLoading ? (
                  <Skeleton className="mt-1 h-6 w-12" />
                ) : (
                  <p className="text-foreground text-xl font-black">{stats?.monthDownloads ?? 0}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Downloads Table */}
        <div className="bg-card/50 ring-border/40 rounded-2xl ring-1 backdrop-blur-sm">
          {downloadsQuery.isLoading ? (
            <div className="space-y-0 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="border-border/40 flex items-center gap-4 border-b py-3 last:border-0"
                >
                  <Skeleton className="h-10 w-10 shrink-0 rounded" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : downloads.length === 0 ? (
            <EmptyState
              icon={Music}
              title="No downloads yet"
              description="Start exploring music to build your download history."
              actionLabel="Browse Music"
              actionHref="/music"
            />
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14" />
                      <TableHead>Track</TableHead>
                      <TableHead>Artist</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {downloads.map((dl) => (
                      <TableRow key={dl.id}>
                        <TableCell>
                          {dl.music?.coverImage || dl.music?.coverArt ? (
                            <Image
                              src={(dl.music.coverImage || dl.music.coverArt) ?? ""}
                              alt={dl.music.title ?? "Cover"}
                              width={40}
                              height={40}
                              className="rounded object-cover"
                            />
                          ) : (
                            <div className="bg-muted flex h-10 w-10 items-center justify-center rounded">
                              <Music className="text-muted-foreground h-4 w-4" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {dl.music?.title ?? "Unknown Track"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {dl.music?.artist?.name ?? "Unknown Artist"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(dl.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRedownload(dl.musicId)}
                          >
                            <Download className="mr-1.5 h-3.5 w-3.5" />
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile List */}
              <div className="sm:hidden">
                {downloads.map((dl) => (
                  <div
                    key={dl.id}
                    className="border-border/40 flex items-center gap-3 border-b px-4 py-3 last:border-0"
                  >
                    {dl.music?.coverImage || dl.music?.coverArt ? (
                      <Image
                        src={(dl.music.coverImage || dl.music.coverArt) ?? ""}
                        alt={dl.music.title ?? "Cover"}
                        width={40}
                        height={40}
                        className="shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded">
                        <Music className="text-muted-foreground h-4 w-4" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {dl.music?.title ?? "Unknown Track"}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {dl.music?.artist?.name ?? "Unknown Artist"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {format(new Date(dl.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRedownload(dl.musicId)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <Pagination page={dlPage} totalPages={totalPages} onPageChange={setDlPage} />
      </div>
    );
  };

  const renderHiddenTab = () => {
    if (hiddenPostsQuery.isLoading) return <ContentSkeleton />;

    const items = (hiddenPostsQuery.data?.hiddenPosts ?? []) as Array<{
      id: string;
      postId: string;
      createdAt: string;
      post: {
        id: string;
        title: string;
        slug: string;
        coverImage: string | null;
        type: string;
      };
    }>;
    const totalPages = hiddenPostsQuery.data?.totalPages ?? 1;

    return (
      <div className="space-y-6">
        {items.length === 0 ? (
          <EmptyState
            icon={EyeOff}
            title="No hidden posts"
            description="Posts you hide from your feed will appear here."
            actionLabel="Browse Feed"
            actionHref="/feed"
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-card/50 ring-border/40 group overflow-hidden rounded-2xl ring-1 backdrop-blur-sm"
                >
                  <div className="bg-muted relative h-[150px] w-full overflow-hidden">
                    {item.post.coverImage ? (
                      <Image
                        src={item.post.coverImage}
                        alt={item.post.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <EyeOff className="text-muted-foreground h-8 w-8" />
                      </div>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() =>
                        toggleHiddenPost.mutate({
                          postId: item.postId,
                          isHidden: true,
                        })
                      }
                      disabled={toggleHiddenPost.isPending}
                    >
                      Unhide
                    </Button>
                  </div>
                  <div className="p-4">
                    <Link href={`/${item.post.slug}`} className="hover:underline">
                      <h3 className="line-clamp-2 font-medium">{item.post.title}</h3>
                    </Link>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {item.post.type}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        Hidden {format(new Date(item.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={hiddenPage} totalPages={totalPages} onPageChange={setHiddenPage} />
          </>
        )}
      </div>
    );
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "saved":
        return renderSavedTab();
      case "bookmarks":
        return renderBookmarksTab();
      case "favorites":
        return renderFavoritesTab();
      case "downloads":
        return renderDownloadsTab();
      case "hidden":
        return renderHiddenTab();
      default:
        return renderSavedTab();
    }
  };

  return (
    <div className="space-y-6">
      <LibraryTabBar activeTab={activeTab} onTabChange={handleTabChange} />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {renderActiveTab()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
