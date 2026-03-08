"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Bookmark, X, Grid3X3, List, BookOpen } from "lucide-react";
import { useUserBookmarks } from "@/hooks/useUserDashboard";
import { useToggleBookmark } from "@/hooks/useUserMutations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function BookmarksView() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState<string>("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data, isLoading } = useUserBookmarks(page, type || undefined, sort);
  const toggleBookmark = useToggleBookmark();

  const handleRemove = (bookmarkId: string) => {
    toggleBookmark.mutate({ bookmarkId });
  };

  if (isLoading) {
    return <BookmarksSkeleton />;
  }

  const bookmarks = data?.bookmarks ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={type}
          onValueChange={(v) => {
            setType(v);
            setPage(1);
          }}
        >
          <TabsList>
            <TabsTrigger value="">All</TabsTrigger>
            <TabsTrigger value="post">Posts</TabsTrigger>
            <TabsTrigger value="music">Music</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as "newest" | "oldest");
              setPage(1);
            }}
            className="bg-background rounded-md border px-3 py-2 text-sm"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="text-muted-foreground mb-4 h-12 w-12" />
          <h2 className="text-lg font-semibold">No bookmarks yet</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Save articles and music to read or listen later.
          </p>
          <Button asChild className="mt-4">
            <Link href="/">Browse content</Link>
          </Button>
        </div>
      ) : (
        <>
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                : "flex flex-col gap-3"
            }
          >
            {bookmarks.map(
              (bookmark: {
                id: string;
                post?: { slug: string; title: string; coverImage?: string };
                music?: { slug: string; title: string; coverArt?: string };
                createdAt: string;
              }) => {
                const item = bookmark.post || bookmark.music;
                const itemType = bookmark.post ? "Post" : "Music";
                const coverSrc = bookmark.post?.coverImage || bookmark.music?.coverArt;
                const href = bookmark.post
                  ? `/${bookmark.post.slug}`
                  : `/music/${bookmark.music?.slug}`;

                return viewMode === "grid" ? (
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
                        onClick={() => handleRemove(bookmark.id)}
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
                        onClick={() => handleRemove(bookmark.id)}
                        disabled={toggleBookmark.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              }
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
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
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BookmarksSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-9 w-20" />
      </div>
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
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
