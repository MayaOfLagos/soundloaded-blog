export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Video } from "lucide-react";
import { PostsTable } from "../posts/_components/PostsTable";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = { title: "Videos — Soundloaded Admin" };

const PAGE_SIZE = 20;

interface VideosPageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    q?: string;
  }>;
}

async function getVideos({ page, status, q }: { page: number; status?: string; q?: string }) {
  const where = {
    type: "VIDEO" as const,
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
}

async function getStatusCounts() {
  const counts = await db.post.groupBy({
    by: ["status"],
    where: { type: "VIDEO" },
    _count: { _all: true },
  });
  const map: Record<string, number> = {};
  counts.forEach((c) => {
    map[c.status] = c._count._all;
  });
  return map;
}

export default async function VideosPage({ searchParams }: VideosPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const status = params.status ?? "ALL";
  const q = params.q ?? "";

  const [{ posts, total }, statusCounts] = await Promise.all([
    getVideos({ page, status, q }),
    getStatusCounts(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { page: String(page), status, q, ...overrides };
    Object.entries(merged).forEach(([k, v]) => {
      if (v && v !== "ALL" && v !== "" && v !== "1") p.set(k, v);
    });
    const qs = p.toString();
    return `/admin/videos${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-foreground text-lg font-bold">Videos</h1>
          <p className="text-muted-foreground text-sm">
            {total.toLocaleString()} video{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/admin/posts/new">
          <Button size="sm" className="bg-brand hover:bg-brand/90 text-brand-foreground gap-1.5">
            <Plus className="h-4 w-4" />
            New Video Post
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
              type="button"
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

      {/* Search */}
      <form method="GET" action="/admin/videos" className="max-w-sm">
        <input type="hidden" name="status" value={status} />
        <Input name="q" defaultValue={q} placeholder="Search videos..." className="bg-card" />
      </form>

      {/* Table */}
      {posts.length === 0 ? (
        <div className="border-border bg-card overflow-hidden rounded-xl border">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Video className="text-muted-foreground/30 mb-3 h-12 w-12" />
            <p className="text-muted-foreground font-medium">No videos found</p>
            <p className="text-muted-foreground/70 mt-1 text-sm">
              {q ? "Try a different search term" : "Create your first video post to get started"}
            </p>
          </div>
        </div>
      ) : (
        <PostsTable posts={posts} />
      )}

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
