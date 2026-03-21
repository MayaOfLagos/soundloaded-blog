"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import Image from "next/image";
import {
  Rss,
  Loader2,
  Trash2,
  Archive,
  Eye,
  ExternalLink,
  MessageSquare,
  Heart,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/useDebounce";

interface FeedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  views: number;
  coverImage: string | null;
  mediaAttachments: Array<{ url: string; type: string; key?: string }>;
  createdAt: string;
  publishedAt: string | null;
  author: {
    id: string;
    name: string | null;
    image: string | null;
    username: string | null;
  } | null;
  _count: {
    comments: number;
    reactions: number;
  };
}

interface FeedResponse {
  posts: FeedPost[];
  total: number;
  page: number;
  totalPages: number;
  statusCounts: Record<string, number>;
}

const STATUS_COLORS: Record<string, string> = {
  PUBLISHED: "bg-green-500/15 text-green-600 border-green-500/20",
  ARCHIVED: "bg-muted text-muted-foreground border-border",
};

export default function AdminFeedPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"archive" | "delete" | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useQuery<FeedResponse>({
    queryKey: ["admin-feed", page, status, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (status !== "ALL") params.set("status", status);
      if (debouncedSearch) params.set("q", debouncedSearch);
      const { data } = await axios.get(`/api/admin/feed?${params}`);
      return data;
    },
  });

  const bulkMutation = useMutation({
    mutationFn: ({ action, ids }: { action: string; ids: string[] }) =>
      axios.post("/api/admin/feed/bulk", { action, ids }),
    onSuccess: (_, variables) => {
      const count = variables.ids.length;
      const verb = variables.action === "archive" ? "archived" : "deleted";
      toast.success(`${count} post${count !== 1 ? "s" : ""} ${verb}`);
      setSelected(new Set());
      setBulkAction(null);
      queryClient.invalidateQueries({ queryKey: ["admin-feed"] });
    },
    onError: () => {
      toast.error("Action failed");
    },
  });

  const posts = data?.posts ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const statusCounts = data?.statusCounts ?? {};
  const allCount = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  const allSelected = posts.length > 0 && selected.size === posts.length;
  const someSelected = selected.size > 0 && selected.size < posts.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(posts.map((p) => p.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function formatTimeAgo(date: string) {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-brand/10 flex h-10 w-10 items-center justify-center rounded-xl">
          <Rss className="text-brand h-5 w-5" />
        </div>
        <div>
          <h1 className="text-foreground text-2xl font-black">Community Feed</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Manage user-generated posts from the community feed
          </p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-1">
        {[
          { label: "All", value: "ALL", count: allCount },
          { label: "Published", value: "PUBLISHED", count: statusCounts.PUBLISHED ?? 0 },
          { label: "Archived", value: "ARCHIVED", count: statusCounts.ARCHIVED ?? 0 },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setStatus(tab.value);
              setPage(1);
              setSelected(new Set());
            }}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              status === tab.value
                ? "bg-brand text-brand-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {tab.label}
            {tab.count > 0 && <span className="ml-1.5 text-xs opacity-70">({tab.count})</span>}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search feed posts..."
          className="bg-card pl-9"
        />
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="border-brand/20 bg-brand/5 flex items-center justify-between gap-3 rounded-lg border px-4 py-2.5">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{selected.size} selected</span>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground h-7 gap-1.5 text-xs"
              onClick={() => setSelected(new Set())}
            >
              <X className="h-3 w-3" /> Clear
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setBulkAction("archive")}
            >
              <Archive className="h-3.5 w-3.5" /> Archive
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5"
              onClick={() => setBulkAction("delete")}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="border-border bg-card overflow-hidden rounded-xl border">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Rss className="text-muted-foreground/30 mb-3 h-12 w-12" />
            <p className="text-muted-foreground font-medium">No feed posts found</p>
            <p className="text-muted-foreground/70 mt-1 text-sm">
              {search ? "Try a different search term" : "Community posts will appear here"}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Select all checkbox */}
          <div className="flex items-center gap-2 px-1">
            <Checkbox
              checked={allSelected ? true : someSelected ? "indeterminate" : false}
              onCheckedChange={toggleAll}
              aria-label="Select all"
            />
            <span className="text-muted-foreground text-xs">Select all</span>
          </div>

          {/* Feed post cards */}
          <div className="space-y-3">
            {posts.map((post) => {
              const isSelected = selected.has(post.id);
              const mediaCount = post.mediaAttachments?.length ?? 0;
              // const hasImages = post.mediaAttachments?.some((m) => m.type?.startsWith("image"));
              const hasVideos = post.mediaAttachments?.some((m) => m.type?.startsWith("video"));

              return (
                <div
                  key={post.id}
                  className={`border-border bg-card overflow-hidden rounded-xl border transition-colors ${
                    isSelected ? "ring-brand/40 ring-2" : ""
                  }`}
                >
                  <div className="flex gap-4 p-4">
                    {/* Checkbox */}
                    <div className="flex items-start pt-1">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleOne(post.id)}
                        aria-label={`Select post by ${post.author?.name}`}
                      />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      {/* Author row */}
                      <div className="mb-2 flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={post.author?.image || ""} />
                          <AvatarFallback className="text-[10px]">
                            {post.author?.name?.charAt(0)?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <span className="text-foreground text-sm font-semibold">
                            {post.author?.name || "Unknown"}
                          </span>
                          {post.author?.username && (
                            <span className="text-muted-foreground ml-1.5 text-xs">
                              @{post.author.username}
                            </span>
                          )}
                          <span className="text-muted-foreground mx-1.5 text-xs">&middot;</span>
                          <span className="text-muted-foreground text-xs">
                            {formatTimeAgo(post.createdAt)}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={`shrink-0 text-[10px] uppercase ${STATUS_COLORS[post.status] ?? ""}`}
                        >
                          {post.status}
                        </Badge>
                      </div>

                      {/* Post content */}
                      <p className="text-foreground line-clamp-3 text-sm leading-relaxed">
                        {post.excerpt || post.title}
                      </p>

                      {/* Media preview */}
                      {mediaCount > 0 && (
                        <div className="mt-2 flex gap-2 overflow-x-auto">
                          {post.mediaAttachments.slice(0, 4).map((media, i) => (
                            <div
                              key={i}
                              className="bg-muted relative h-20 w-20 shrink-0 overflow-hidden rounded-lg"
                            >
                              {media.type?.startsWith("image") ? (
                                <Image
                                  src={media.url}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : media.type?.startsWith("video") ? (
                                <div className="flex h-full w-full items-center justify-center">
                                  <Film className="text-muted-foreground h-6 w-6" />
                                </div>
                              ) : null}
                              {i === 3 && mediaCount > 4 && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                  <span className="text-sm font-bold text-white">
                                    +{mediaCount - 4}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Stats row */}
                      <div className="mt-3 flex items-center gap-4">
                        <span className="text-muted-foreground flex items-center gap-1 text-xs">
                          <Eye className="h-3 w-3" /> {post.views.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground flex items-center gap-1 text-xs">
                          <Heart className="h-3 w-3" /> {post._count.reactions}
                        </span>
                        <span className="text-muted-foreground flex items-center gap-1 text-xs">
                          <MessageSquare className="h-3 w-3" /> {post._count.comments}
                        </span>
                        {mediaCount > 0 && (
                          <span className="text-muted-foreground flex items-center gap-1 text-xs">
                            {hasVideos ? (
                              <Film className="h-3 w-3" />
                            ) : (
                              <ImageIcon className="h-3 w-3" />
                            )}
                            {mediaCount} media
                          </span>
                        )}
                        <div className="flex-1" />
                        <a
                          href={`/feed`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Page {page} of {totalPages} &middot; {total.toLocaleString()} posts
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Bulk action confirmation */}
      <AlertDialog open={!!bulkAction} onOpenChange={() => setBulkAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkAction === "archive" ? "Archive" : "Delete"} {selected.size} post
              {selected.size !== 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkAction === "archive"
                ? "Archived posts will be hidden from the feed but can be restored later."
                : "Deleted posts will be permanently removed. This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={bulkAction === "delete" ? "destructive" : "default"}
              onClick={(e) => {
                e.preventDefault();
                if (bulkAction) {
                  bulkMutation.mutate({ action: bulkAction, ids: Array.from(selected) });
                }
              }}
              disabled={bulkMutation.isPending}
            >
              {bulkMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {bulkAction === "archive" ? "Archive" : "Delete"} {selected.size} Post
              {selected.size !== 1 ? "s" : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
