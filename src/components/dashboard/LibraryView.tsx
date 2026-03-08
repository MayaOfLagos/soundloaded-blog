"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Library, Grid3X3, List, BookOpen } from "lucide-react";
import { useUserLibrary } from "@/hooks/useUserDashboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export function LibraryView() {
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data, isLoading } = useUserLibrary(page, tab, sort);

  if (isLoading) {
    return <LibrarySkeleton />;
  }

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2">
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v);
            setPage(1);
          }}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="music">Music</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
            <TabsTrigger value="gist">Gist</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
          </TabsList>
        </Tabs>

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
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="text-muted-foreground mb-4 h-12 w-12" />
          <h2 className="text-lg font-semibold">Your library is empty</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Bookmark or favorite content to build your personal library.
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
            {items.map(
              (item: {
                id: string;
                title?: string;
                slug?: string;
                type: string;
                coverImage?: string;
                coverArt?: string;
                savedAs: string;
                savedAt: string;
              }) => {
                const coverSrc = item.coverImage || item.coverArt;
                const href = item.type === "music" ? `/music/${item.slug}` : `/${item.slug}`;

                return (
                  <div
                    key={item.id}
                    className="bg-card/50 ring-border/40 group overflow-hidden rounded-2xl ring-1 backdrop-blur-sm"
                  >
                    {viewMode === "grid" ? (
                      <>
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
                      </>
                    ) : (
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
                    )}
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

function LibrarySkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Skeleton className="h-9 w-20" />
      </div>
      <Skeleton className="h-10 w-80" />
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
