"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, ExternalLink, Trash2, Loader2, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { DeletePostButton } from "./DeletePostButton";
import { formatDate } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  PUBLISHED: "bg-green-500/15 text-green-600 border-green-500/20",
  DRAFT: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20",
  SCHEDULED: "bg-blue-500/15 text-blue-600 border-blue-500/20",
  ARCHIVED: "bg-muted text-muted-foreground border-border",
};

const TYPE_COLORS: Record<string, string> = {
  NEWS: "bg-brand/10 text-brand border-brand/20",
  MUSIC: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  GIST: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  ALBUM: "bg-teal-500/10 text-teal-600 border-teal-500/20",
  VIDEO: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  LYRICS: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  COMMUNITY: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
};

interface Post {
  id: string;
  title: string;
  slug: string;
  status: string;
  type: string;
  views: number;
  publishedAt: Date | string | null;
  createdAt: Date | string;
  category: { name: string; slug: string } | null;
  author: { name: string | null } | null;
}

interface PostsTableProps {
  posts: Post[];
}

export function PostsTable({ posts }: PostsTableProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const allSelected = posts.length > 0 && selected.size === posts.length;
  const someSelected = selected.size > 0 && selected.size < posts.length;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(posts.map((p) => p.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const { mutate: bulkDelete, isPending } = useMutation({
    mutationFn: () => axios.post("/api/admin/posts/bulk-delete", { ids: Array.from(selected) }),
    onSuccess: (res) => {
      const count = res.data.archived ?? selected.size;
      toast.success(`${count} post${count !== 1 ? "s" : ""} archived`);
      setSelected(new Set());
      setBulkDeleteOpen(false);
      router.refresh();
    },
    onError: () => {
      toast.error("Failed to archive posts");
    },
  });

  return (
    <>
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="border-destructive/20 bg-destructive/5 flex items-center justify-between gap-3 rounded-lg border px-4 py-2.5">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              {selected.size} post{selected.size !== 1 ? "s" : ""} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground h-7 gap-1.5 text-xs"
              onClick={() => setSelected(new Set())}
            >
              <X className="h-3 w-3" />
              Clear
            </Button>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5"
            onClick={() => setBulkDeleteOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Selected
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border-border bg-card overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={toggleAll}
                    aria-label="Select all posts"
                  />
                </TableHead>
                <TableHead className="w-[40%]">Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="hidden md:table-cell">Published</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Views</TableHead>
                <TableHead className="w-28 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => {
                const isSelected = selected.has(post.id);
                return (
                  <TableRow
                    key={post.id}
                    className={`border-border ${isSelected ? "bg-muted/50" : ""}`}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleOne(post.id)}
                        aria-label={`Select "${post.title}"`}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <Link
                          href={`/admin/posts/${post.id}`}
                          className="text-foreground hover:text-primary line-clamp-1 text-sm font-semibold transition-colors"
                        >
                          {post.title}
                        </Link>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          by {post.author?.name ?? "Unknown"} &middot; /{post.slug}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] tracking-wide uppercase ${TYPE_COLORS[post.type] ?? ""}`}
                      >
                        {post.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] tracking-wide uppercase ${STATUS_COLORS[post.status] ?? ""}`}
                      >
                        {post.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-muted-foreground text-sm">
                        {post.category?.name ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-muted-foreground text-sm">
                        {post.publishedAt ? formatDate(post.publishedAt) : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-right lg:table-cell">
                      <span className="text-sm font-medium">{post.views.toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/posts/${post.id}`}>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="sr-only">Edit</span>
                          </Button>
                        </Link>
                        {post.status === "PUBLISHED" && (
                          <Link href={`/${post.slug}`} target="_blank">
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span className="sr-only">View live</span>
                            </Button>
                          </Link>
                        )}
                        <DeletePostButton postId={post.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Bulk delete confirmation dialog */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selected.size} post{selected.size !== 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selected.size === 1
                ? "This post will be archived and removed from the public site. You can restore it later from the Archived tab."
                : `These ${selected.size} posts will be archived and removed from the public site. You can restore them later from the Archived tab.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                bulkDelete();
              }}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete {selected.size} Post{selected.size !== 1 ? "s" : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
