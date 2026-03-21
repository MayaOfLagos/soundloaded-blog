export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { Mic2 } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArtistsTable } from "./_components/ArtistsTable";

export const metadata: Metadata = { title: "Artists — Soundloaded Admin" };

const PAGE_SIZE = 20;

interface ArtistsPageProps {
  searchParams: Promise<{ page?: string; q?: string }>;
}

async function getArtists({ page, q }: { page: number; q?: string }) {
  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { genre: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [artists, total] = await Promise.all([
    db.artist.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        _count: { select: { music: true, albums: true } },
      },
    }),
    db.artist.count({ where }),
  ]);

  return { artists, total };
}

export default async function ArtistsPage({ searchParams }: ArtistsPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const q = params.q ?? "";

  const { artists, total } = await getArtists({ page, q });
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { page: String(page), q, ...overrides };
    Object.entries(merged).forEach(([k, v]) => {
      if (v && v !== "" && v !== "1") p.set(k, v);
    });
    const qs = p.toString();
    return `/admin/artists${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {total.toLocaleString()} artist{total !== 1 ? "s" : ""}
        </p>
        {/* Add Artist dialog is in ArtistsTable */}
      </div>

      {/* Search */}
      <form method="GET" action="/admin/artists" className="max-w-sm">
        <Input name="q" defaultValue={q} placeholder="Search artists..." className="bg-card" />
      </form>

      {/* Table */}
      {artists.length === 0 ? (
        <div className="border-border bg-card overflow-hidden rounded-xl border">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Mic2 className="text-muted-foreground/30 mb-3 h-12 w-12" />
            <p className="text-muted-foreground font-medium">No artists found</p>
            <p className="text-muted-foreground/70 mt-1 text-sm">
              {q ? "Try a different search term" : "Add your first artist to get started"}
            </p>
          </div>
        </div>
      ) : (
        <ArtistsTable artists={artists} />
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
