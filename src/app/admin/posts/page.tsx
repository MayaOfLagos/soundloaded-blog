import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus, FileText, Eye, Pencil, Trash2, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Posts — Soundloaded Admin" };

const PAGE_SIZE = 20;

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
};

interface PostsPageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    q?: string;
  }>;
}

async function getPosts({ page, status, q }: { page: number; status?: string; q?: string }) {
  try {
    const where = {
      ...(status && status !== "ALL" ? { status: status as never } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" as const } },
              { slug: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [posts, total] = await Promise.all([
      db.post.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          type: true,
          views: true,
          publishedAt: true,
          createdAt: true,
          category: { select: { name: true, slug: true } },
          author: { select: { name: true } },
        },
      }),
      db.post.count({ where }),
    ]);

    return { posts, total };
  } catch {
    return { posts: [], total: 0 };
  }
}

async function getStatusCounts() {
  try {
    const counts = await db.post.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
    const map: Record<string, number> = {};
    counts.forEach((c) => {
      map[c.status] = c._count._all;
    });
    return map;
  } catch {
    return {};
  }
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const status = params.status ?? "ALL";
  const q = params.q ?? "";

  const [{ posts, total }, statusCounts] = await Promise.all([
    getPosts({ page, status, q }),
    getStatusCounts(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { page: String(page), status, q, ...overrides };
    Object.entries(merged).forEach(([k, v]) => {
      if (v && v !== "ALL" && v !== "" && v !== "1") p.set(k, v);
    });
    return `/admin/posts?${p.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-black">Posts</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {total.toLocaleString()} post{total !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link href="/admin/posts/new">
          <Button className="bg-brand hover:bg-brand/90 text-brand-foreground gap-1.5">
            <Plus className="h-4 w-4" />
            New Post
          </Button>
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-1">
        {[
          {
            label: "All",
            value: "ALL",
            count: Object.values(statusCounts).reduce((a, b) => a + b, 0),
          },
          { label: "Published", value: "PUBLISHED", count: statusCounts.PUBLISHED ?? 0 },
          { label: "Draft", value: "DRAFT", count: statusCounts.DRAFT ?? 0 },
          { label: "Scheduled", value: "SCHEDULED", count: statusCounts.SCHEDULED ?? 0 },
          { label: "Archived", value: "ARCHIVED", count: statusCounts.ARCHIVED ?? 0 },
        ].map((tab) => (
          <Link key={tab.value} href={buildUrl({ status: tab.value, page: "1" })}>
            <button
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                status === tab.value
                  ? "bg-brand text-brand-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tab.label}
              {tab.count > 0 && <span className="ml-1.5 text-xs opacity-70">({tab.count})</span>}
            </button>
          </Link>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-3">
        <form method="GET" action="/admin/posts" className="min-w-60 flex-1">
          <input type="hidden" name="status" value={status} />
          <Input name="q" defaultValue={q} placeholder="Search posts..." className="bg-card" />
        </form>
      </div>

      {/* Table */}
      <div className="border-border bg-card overflow-hidden rounded-xl border">
        <Suspense
          fallback={<div className="text-muted-foreground p-8 text-center">Loading...</div>}
        >
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="text-muted-foreground/30 mb-3 h-12 w-12" />
              <p className="text-muted-foreground font-medium">No posts found</p>
              <p className="text-muted-foreground/70 mt-1 text-sm">
                {q ? "Try a different search term" : "Create your first post to get started"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-[40%]">Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="w-28 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id} className="border-border">
                    <TableCell>
                      <div>
                        <p className="text-foreground line-clamp-1 text-sm font-semibold">
                          {post.title}
                        </p>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          by {post.author.name ?? "Unknown"} &middot; /{post.slug}
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
                    <TableCell>
                      <span className="text-muted-foreground text-sm">
                        {post.category?.name ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm">
                        {post.publishedAt ? formatDate(post.publishedAt) : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-foreground text-sm font-medium">
                        {post.views.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/posts/${post.id}`}>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        {post.status === "PUBLISHED" && (
                          <Link href={`/${post.slug}`} target="_blank">
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        )}
                        <form
                          action={`/api/admin/posts/${post.id}`}
                          method="POST"
                          onSubmit={(e) => {
                            if (!confirm("Delete this post?")) e.preventDefault();
                          }}
                        >
                          <input type="hidden" name="_method" value="DELETE" />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive h-8 w-8"
                            type="submit"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Suspense>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Page {page} of {totalPages} &middot; {total.toLocaleString()} results
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={buildUrl({ page: String(page - 1) })}>
                <Button variant="outline" size="sm">
                  Previous
                </Button>
              </Link>
            )}
            {page < totalPages && (
              <Link href={buildUrl({ page: String(page + 1) })}>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
