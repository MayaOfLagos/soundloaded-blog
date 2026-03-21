"use client";

import { useRef, useCallback, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Search, Loader2, Users } from "lucide-react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFollowCheck, useToggleFollow } from "@/hooks/useFollow";
import { cn } from "@/lib/utils";
import type { SuggestedUser } from "./SuggestedUsers";

interface FollowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAGE_SIZE = 20;

function FollowButton({ userId }: { userId: string }) {
  const { data, isLoading } = useFollowCheck(userId);
  const toggleFollow = useToggleFollow();
  const isFollowing = data?.following ?? false;

  return (
    <button
      type="button"
      onClick={() => toggleFollow.mutate({ userId, isFollowing })}
      disabled={toggleFollow.isPending || isLoading}
      className={cn(
        "shrink-0 rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors",
        isFollowing
          ? "bg-muted text-foreground hover:bg-destructive/10 hover:text-destructive"
          : "bg-brand hover:bg-brand/90 text-white"
      )}
    >
      {toggleFollow.isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : isFollowing ? (
        "Following"
      ) : (
        "Follow"
      )}
    </button>
  );
}

export function FollowDialog({ open, onOpenChange }: FollowDialogProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value.trim());
    }, 300);
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } =
    useInfiniteQuery({
      queryKey: ["follow-suggestions-dialog", debouncedSearch],
      queryFn: async ({ pageParam }) => {
        const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
        if (pageParam) params.set("cursor", pageParam);
        if (debouncedSearch) params.set("q", debouncedSearch);
        const { data } = await axios.get<{
          suggestions: SuggestedUser[];
          nextCursor: string | null;
        }>(`/api/follow/suggestions?${params}`);
        return data;
      },
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: open,
      retry: 2,
    });

  const allUsers = data?.pages.flatMap((p) => p.suggestions) ?? [];

  // Intersection observer for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentryRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        },
        { rootMargin: "200px" }
      );
      observerRef.current.observe(node);
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-border border-b px-5 pt-5 pb-4">
          <DialogTitle className="text-lg font-bold">People to follow</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="border-border border-b px-4 py-3">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search people..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Users list */}
        <ScrollArea className="min-h-0 flex-1">
          <div className="divide-border divide-y px-4">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <div className="bg-muted h-11 w-11 animate-pulse rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="bg-muted h-3.5 w-28 animate-pulse rounded" />
                    <div className="bg-muted h-3 w-40 animate-pulse rounded" />
                  </div>
                  <div className="bg-muted h-8 w-20 animate-pulse rounded-lg" />
                </div>
              ))
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="text-muted-foreground/30 mb-3 h-10 w-10" />
                <p className="text-muted-foreground text-sm font-medium">
                  Failed to load suggestions
                </p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="text-brand hover:text-brand/80 mt-2 text-xs font-semibold"
                >
                  Try again
                </button>
              </div>
            ) : allUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="text-muted-foreground/30 mb-3 h-10 w-10" />
                <p className="text-muted-foreground text-sm font-medium">
                  {debouncedSearch ? "No users found" : "No suggestions right now"}
                </p>
                {debouncedSearch && (
                  <p className="text-muted-foreground/70 mt-1 text-xs">
                    Try a different search term
                  </p>
                )}
              </div>
            ) : (
              <>
                {allUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 py-3">
                    <Link
                      href={user.username ? `/author/${user.username}` : "#"}
                      onClick={() => onOpenChange(false)}
                      className="bg-muted flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full"
                    >
                      {user.image ? (
                        <Image
                          src={user.image}
                          alt={user.name || ""}
                          width={44}
                          height={44}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-muted-foreground text-sm font-semibold">
                          {user.name?.charAt(0)?.toUpperCase()}
                        </span>
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={user.username ? `/author/${user.username}` : "#"}
                        onClick={() => onOpenChange(false)}
                        className="text-foreground hover:text-brand block truncate text-sm font-semibold transition-colors"
                      >
                        {user.name}
                      </Link>
                      {user.bio ? (
                        <p className="text-muted-foreground line-clamp-1 text-xs">{user.bio}</p>
                      ) : (
                        <p className="text-muted-foreground text-xs">
                          {user.postCount} posts · {user.followerCount} followers
                        </p>
                      )}
                    </div>
                    <FollowButton userId={user.id} />
                  </div>
                ))}

                {/* Infinite scroll sentry */}
                {hasNextPage && (
                  <div ref={sentryRef} className="flex justify-center py-4">
                    {isFetchingNextPage && (
                      <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
