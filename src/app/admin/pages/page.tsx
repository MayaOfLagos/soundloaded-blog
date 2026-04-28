export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import type { PostStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PagesTable } from "./_components/PagesTable";
import { SeedPagesButton } from "./_components/SeedPagesButton";

export const metadata: Metadata = { title: "Pages — Soundloaded Admin" };

const PAGE_SIZE = 20;
const PAGE_STATUSES = new Set<string>(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]);

interface AdminPagesProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    q?: string;
  }>;
}

async function getPages({ page, status, q }: { page: number; status?: string; q?: string }) {
  const statusFilter = status && PAGE_STATUSES.has(status) ? (status as PostStatus) : null;
  const where: Prisma.PageWhereInput = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { slug: { contains: q, mode: "insensitive" as const } },
            { excerpt: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [pages, total] = await Promise.all([
    db.page.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        template: true,
        publishedAt: true,
        updatedAt: true,
        views: true,
        showInHeader: true,
        showInFooter: true,
        isSystem: true,
        author: { select: { name: true, email: true } },
      },
    }),
    db.page.count({ where }),
  ]);

  return { pages, total };
}

async function getStatusCounts() {
  const counts = await db.page.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const map: Record<string, number> = {};
  counts.forEach((count) => {
    map[count.status] = count._count._all;
  });
  return map;
}

export default async function PagesPage({ searchParams }: AdminPagesProps) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10));
  const status = params.status ?? "ALL";
  const q = params.q ?? "";

  const [{ pages, total }, statusCounts] = await Promise.all([
    getPages({ page, status, q }),
    getStatusCounts(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { page: String(page), status, q, ...overrides };
    Object.entries(merged).forEach(([key, value]) => {
      if (value && value !== "ALL" && value !== "" && value !== "1") next.set(key, value);
    });
    const qs = next.toString();
    return `/admin/pages${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-muted-foreground text-sm">
          {total.toLocaleString()} page{total !== 1 ? "s" : ""}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <SeedPagesButton />
          <Button
            size="sm"
            className="bg-brand hover:bg-brand/90 text-brand-foreground gap-1.5"
            asChild
          >
            <Link href="/admin/pages/new">
              <Plus className="h-4 w-4" />
              New Page
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {[
          {
            label: "All",
            value: "ALL",
            count: Object.values(statusCounts).reduce((acc, next) => acc + next, 0),
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

      <form method="GET" action="/admin/pages" className="max-w-sm">
        <input type="hidden" name="status" value={status} />
        <Input name="q" defaultValue={q} placeholder="Search pages..." className="bg-card" />
      </form>

      {pages.length === 0 ? (
        <div className="border-border bg-card overflow-hidden rounded-xl border">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="text-muted-foreground/30 mb-3 h-12 w-12" />
            <p className="text-muted-foreground font-medium">No pages found</p>
            <p className="text-muted-foreground/70 mt-1 text-sm">
              {q ? "Try another search term" : "Create evergreen pages for Soundloaded"}
            </p>
          </div>
        </div>
      ) : (
        <PagesTable pages={pages} />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Page {page} of {totalPages} &middot; {total.toLocaleString()} results
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link href={buildUrl({ page: String(page - 1) })}>Previous</Link>
              </Button>
            )}
            {page < totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link href={buildUrl({ page: String(page + 1) })}>Next</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
