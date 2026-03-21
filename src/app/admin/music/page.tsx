export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { Music, Plus, TrendingUp, Download, Disc3 } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MusicTable } from "./_components/MusicTable";

export const metadata: Metadata = { title: "Music — Soundloaded Admin" };

const PAGE_SIZE = 25;

interface MusicPageProps {
  searchParams: Promise<{ page?: string; q?: string }>;
}

async function getMusicTracks({ page, q }: { page: number; q?: string }) {
  const where = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { artist: { name: { contains: q, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const [tracks, total] = await Promise.all([
    db.music.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        artist: { select: { id: true, name: true, slug: true } },
        album: { select: { id: true, title: true, slug: true } },
      },
    }),
    db.music.count({ where }),
  ]);

  // Serialize BigInt fileSize
  const serialized = tracks.map((t) => ({
    ...t,
    fileSize: t.fileSize.toString(),
  }));

  return { tracks: serialized, total };
}

async function getMusicStats() {
  const [totalTracks, downloads, topTrack] = await Promise.all([
    db.music.count(),
    db.music.aggregate({ _sum: { downloadCount: true } }),
    db.music.findFirst({
      orderBy: { downloadCount: "desc" },
      select: { title: true, downloadCount: true },
    }),
  ]);

  return {
    totalTracks,
    totalDownloads: downloads._sum.downloadCount ?? 0,
    topTrack,
  };
}

export default async function MusicPage({ searchParams }: MusicPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const q = params.q ?? "";

  const [{ tracks, total }, stats] = await Promise.all([
    getMusicTracks({ page, q }),
    getMusicStats(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { page: String(page), q, ...overrides };
    Object.entries(merged).forEach(([k, v]) => {
      if (v && v !== "" && v !== "1") p.set(k, v);
    });
    const qs = p.toString();
    return `/admin/music${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="bg-brand/10 flex h-10 w-10 items-center justify-center rounded-lg">
              <Music className="text-brand h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalTracks.toLocaleString()}</p>
              <p className="text-muted-foreground text-xs">Total Tracks</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <Download className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalDownloads.toLocaleString()}</p>
              <p className="text-muted-foreground text-xs">Total Downloads</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="line-clamp-1 text-sm font-bold">{stats.topTrack?.title ?? "—"}</p>
              <p className="text-muted-foreground text-xs">
                Most Downloaded
                {stats.topTrack ? ` (${stats.topTrack.downloadCount.toLocaleString()})` : ""}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {total.toLocaleString()} track{total !== 1 ? "s" : ""}
        </p>
        <Link href="/admin/music/upload">
          <Button size="sm" className="bg-brand hover:bg-brand/90 text-brand-foreground gap-1.5">
            <Plus className="h-4 w-4" />
            Upload Music
          </Button>
        </Link>
      </div>

      {/* Search */}
      <form method="GET" action="/admin/music" className="max-w-sm">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search tracks or artists..."
          className="bg-card"
        />
      </form>

      {/* Table */}
      {tracks.length === 0 ? (
        <div className="border-border bg-card overflow-hidden rounded-xl border">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Disc3 className="text-muted-foreground/30 mb-3 h-12 w-12" />
            <p className="text-muted-foreground font-medium">No tracks found</p>
            <p className="text-muted-foreground/70 mt-1 text-sm">
              {q ? "Try a different search term" : "Upload your first track to get started"}
            </p>
          </div>
        </div>
      ) : (
        <MusicTable tracks={tracks} />
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
