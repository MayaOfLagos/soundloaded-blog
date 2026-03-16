import type { Metadata } from "next";
import Link from "next/link";
import { Disc3 } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlbumsTable } from "./_components/AlbumsTable";

export const metadata: Metadata = { title: "Albums — Soundloaded Admin" };

const PAGE_SIZE = 20;

interface AlbumsPageProps {
  searchParams: Promise<{ page?: string; q?: string }>;
}

async function getAlbums({ page, q }: { page: number; q?: string }) {
  const where = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { artist: { name: { contains: q, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const [albums, total] = await Promise.all([
    db.album.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        artist: { select: { id: true, name: true, slug: true } },
        _count: { select: { tracks: true } },
      },
    }),
    db.album.count({ where }),
  ]);

  return { albums, total };
}

async function getArtistsForDropdown() {
  return db.artist.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export default async function AlbumsPage({ searchParams }: AlbumsPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const q = params.q ?? "";

  const [{ albums, total }, artists] = await Promise.all([
    getAlbums({ page, q }),
    getArtistsForDropdown(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { page: String(page), q, ...overrides };
    Object.entries(merged).forEach(([k, v]) => {
      if (v && v !== "" && v !== "1") p.set(k, v);
    });
    const qs = p.toString();
    return `/admin/albums${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {total.toLocaleString()} album{total !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Search */}
      <form method="GET" action="/admin/albums" className="max-w-sm">
        <Input name="q" defaultValue={q} placeholder="Search albums..." className="bg-card" />
      </form>

      {/* Table */}
      {albums.length === 0 ? (
        <div className="border-border bg-card overflow-hidden rounded-xl border">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Disc3 className="text-muted-foreground/30 mb-3 h-12 w-12" />
            <p className="text-muted-foreground font-medium">No albums found</p>
            <p className="text-muted-foreground/70 mt-1 text-sm">
              {q ? "Try a different search term" : "Add your first album to get started"}
            </p>
          </div>
        </div>
      ) : (
        <AlbumsTable albums={albums} artists={artists} />
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
