export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ExternalLink, Globe, Settings2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Fanlinks — Admin" };

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  PUBLISHED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  ARCHIVED: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  SUSPENDED: "bg-red-500/15 text-red-400 border-red-500/20",
};

export default async function AdminFanlinksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const { q, status, page: pageStr } = await searchParams;
  const page = parseInt(pageStr ?? "1", 10);
  const limit = 25;

  const where = {
    ...(status ? { status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SUSPENDED" } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { slug: { contains: q, mode: "insensitive" as const } },
            { artistName: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [fanlinks, total] = await Promise.all([
    db.fanlink.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        artist: { select: { id: true, name: true, slug: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { clicks: true, emails: true } },
      },
    }),
    db.fanlink.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const buildUrl = (params: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.status) sp.set("status", params.status);
    if (params.page && params.page !== "1") sp.set("page", params.page);
    const str = sp.toString();
    return `/admin/fanlinks${str ? `?${str}` : ""}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-black">Fanlinks</h1>
          <p className="text-muted-foreground text-sm">{total.toLocaleString()} total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card/60 ring-border/40 flex flex-wrap gap-3 rounded-2xl p-4 ring-1 backdrop-blur-sm">
        <form className="flex flex-1 flex-wrap gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search title, slug, artist…"
            className="bg-input border-border text-foreground placeholder:text-muted-foreground min-w-[200px] flex-1 rounded-xl border px-3 py-2 text-sm"
          />
          <select
            name="status"
            defaultValue={status ?? ""}
            className="bg-input border-border text-foreground rounded-xl border px-3 py-2 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
          <Button type="submit" size="sm" variant="outline">
            Filter
          </Button>
          {(q || status) && (
            <Button asChild size="sm" variant="ghost">
              <Link href="/admin/fanlinks">Clear</Link>
            </Button>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="bg-card/60 ring-border/40 overflow-hidden rounded-2xl ring-1 backdrop-blur-sm">
        <div className="text-muted-foreground border-border/40 hidden border-b px-5 py-3 text-xs font-semibold tracking-wider uppercase sm:grid sm:grid-cols-[2fr_1fr_80px_80px_80px_100px_80px]">
          <span>Fanlink</span>
          <span>Creator</span>
          <span className="text-right">Clicks</span>
          <span className="text-right">Visitors</span>
          <span className="text-right">Emails</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        {fanlinks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Globe className="text-muted-foreground mb-3 h-10 w-10" />
            <p className="text-foreground font-semibold">No fanlinks found</p>
          </div>
        ) : (
          <div className="divide-border/30 divide-y">
            {fanlinks.map((fl) => (
              <div
                key={fl.id}
                className="hover:bg-muted/30 items-center gap-4 px-5 py-3.5 transition-colors sm:grid sm:grid-cols-[2fr_1fr_80px_80px_80px_100px_80px]"
              >
                {/* Info */}
                <div className="flex min-w-0 items-center gap-3">
                  <div className="bg-muted relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg">
                    {fl.coverArt ? (
                      <Image
                        src={fl.coverArt}
                        alt={fl.title}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Globe className="text-muted-foreground h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-foreground truncate text-sm font-bold">{fl.title}</p>
                    <p className="text-muted-foreground truncate font-mono text-[11px]">
                      /fanlink/{fl.slug}
                    </p>
                  </div>
                </div>

                {/* Creator */}
                <div className="hidden sm:block">
                  <p className="text-foreground truncate text-xs font-medium">
                    {fl.createdBy.name}
                  </p>
                  <p className="text-muted-foreground truncate text-[11px]">{fl.artist.name}</p>
                </div>

                {/* Stats */}
                <p className="text-foreground hidden text-right text-sm font-medium sm:block">
                  {fl.totalClicks.toLocaleString()}
                </p>
                <p className="text-foreground hidden text-right text-sm font-medium sm:block">
                  {fl.uniqueVisitors.toLocaleString()}
                </p>
                <p className="text-foreground hidden text-right text-sm font-medium sm:block">
                  {fl._count.emails.toLocaleString()}
                </p>

                {/* Status */}
                <div className="hidden sm:flex">
                  <Badge
                    variant="outline"
                    className={cn("border text-[10px]", STATUS_STYLES[fl.status])}
                  >
                    {fl.status}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="hidden items-center gap-1 sm:flex">
                  {fl.status === "PUBLISHED" && (
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title="View live"
                    >
                      <Link href={`/fanlink/${fl.slug}`} target="_blank">
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </Button>
                  )}
                  <Button asChild variant="ghost" size="icon" className="h-7 w-7" title="Manage">
                    <Link href={`/admin/fanlinks/${fl.id}`}>
                      <Settings2 className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Button asChild variant="outline" size="sm">
                <Link href={buildUrl({ q, status, page: String(page - 1) })}>Previous</Link>
              </Button>
            )}
            {page < totalPages && (
              <Button asChild variant="outline" size="sm">
                <Link href={buildUrl({ q, status, page: String(page + 1) })}>Next</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
