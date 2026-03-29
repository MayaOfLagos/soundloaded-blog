import type { Metadata } from "next";
import Link from "next/link";
import { ListMusic } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlaylistsTable } from "./_components/PlaylistsTable";

export const metadata: Metadata = { title: "Playlists — Admin" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{ page?: string; q?: string }>;
}

export default async function AdminPlaylistsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1"));
  const q = params.q?.trim() ?? "";

  const where = q ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }] } : {};

  const [playlists, total] = await Promise.all([
    db.playlist.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        user: { select: { name: true, username: true } },
        _count: { select: { tracks: true } },
      },
    }),
    db.playlist.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { page: String(page), q, ...overrides };
    Object.entries(merged).forEach(([k, v]) => {
      if (v && v !== "" && (k !== "page" || v !== "1")) p.set(k, v);
    });
    const qs = p.toString();
    return `/admin/playlists${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">Playlists</h1>
          <p className="text-muted-foreground text-sm">
            {total.toLocaleString()} playlist{total !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Search */}
      <form method="GET" action="/admin/playlists" className="max-w-sm">
        <Input name="q" defaultValue={q} placeholder="Search playlists..." className="bg-card" />
      </form>

      {/* Table or empty */}
      {playlists.length === 0 ? (
        <div className="border-border bg-card overflow-hidden rounded-xl border">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ListMusic className="text-muted-foreground/30 mb-3 h-12 w-12" />
            <p className="text-muted-foreground font-medium">No playlists found</p>
            <p className="text-muted-foreground/70 mt-1 text-sm">
              {q ? "Try a different search term" : "No playlists have been created yet"}
            </p>
          </div>
        </div>
      ) : (
        <PlaylistsTable
          playlists={playlists.map((p) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            description: p.description,
            isPublic: p.isPublic,
            trackCount: p._count.tracks,
            ownerName: p.user.name || p.user.username || "Unknown",
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
          }))}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Page {page} of {totalPages}
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
