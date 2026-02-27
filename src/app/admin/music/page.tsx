import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Upload, Music, Pencil, Trash2, Download, TrendingUp } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatFileSize } from "@/lib/utils";

export const metadata: Metadata = { title: "Music — Soundloaded Admin" };

const PAGE_SIZE = 25;

interface MusicPageProps {
  searchParams: Promise<{ page?: string; q?: string }>;
}

async function getMusicTracks({ page, q }: { page: number; q?: string }) {
  try {
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
          artist: { select: { name: true, slug: true } },
          album: { select: { title: true } },
          _count: { select: { downloads: true } },
        },
      }),
      db.music.count({ where }),
    ]);

    return { tracks, total };
  } catch {
    return { tracks: [], total: 0 };
  }
}

async function getMusicStats() {
  try {
    const [totalTracks, totalDownloads, topTrack] = await Promise.all([
      db.music.count(),
      db.download.count(),
      db.music.findFirst({
        orderBy: { downloadCount: "desc" },
        select: { title: true, downloadCount: true },
      }),
    ]);
    return { totalTracks, totalDownloads, topTrack };
  } catch {
    return { totalTracks: 0, totalDownloads: 0, topTrack: null };
  }
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
      if (v && v !== "1") p.set(k, v);
    });
    return `/admin/music?${p.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-black">Music</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {total.toLocaleString()} track{total !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link href="/admin/music/upload">
          <Button className="bg-brand hover:bg-brand/90 text-brand-foreground gap-1.5">
            <Upload className="h-4 w-4" />
            Upload Music
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-sm">Total Tracks</p>
          <p className="text-foreground mt-1 text-2xl font-black">
            {stats.totalTracks.toLocaleString()}
          </p>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-sm">Total Downloads</p>
          <p className="text-foreground mt-1 text-2xl font-black">
            {stats.totalDownloads.toLocaleString()}
          </p>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-sm">Most Downloaded</p>
          <p className="text-foreground mt-1 truncate text-base font-bold">
            {stats.topTrack?.title ?? "—"}
          </p>
          {stats.topTrack && (
            <p className="text-muted-foreground text-xs">
              {stats.topTrack.downloadCount.toLocaleString()} downloads
            </p>
          )}
        </div>
      </div>

      {/* Search */}
      <form method="GET" action="/admin/music">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search tracks or artists..."
          className="border-input bg-card ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full max-w-sm rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
        />
      </form>

      {/* Table */}
      <div className="border-border bg-card overflow-hidden rounded-xl border">
        {tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Music className="text-muted-foreground/30 mb-3 h-12 w-12" />
            <p className="text-muted-foreground font-medium">No tracks found</p>
            <p className="text-muted-foreground/70 mt-1 text-sm">
              Upload your first music track to get started
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-12">Cover</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Artist</TableHead>
                <TableHead>Genre</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">
                  <span className="flex items-center justify-end gap-1">
                    <Download className="h-3 w-3" /> Downloads
                  </span>
                </TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tracks.map((track) => (
                <TableRow key={track.id} className="border-border">
                  <TableCell>
                    <div className="bg-muted relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md">
                      {track.coverArt ? (
                        <Image
                          src={track.coverArt}
                          alt={track.title}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Music className="text-muted-foreground/50 h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-foreground line-clamp-1 text-sm font-semibold">
                        {track.title}
                      </p>
                      {track.album && (
                        <p className="text-muted-foreground text-xs">{track.album.title}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">{track.artist.name}</span>
                  </TableCell>
                  <TableCell>
                    {track.genre ? (
                      <Badge variant="outline" className="text-[10px]">
                        {track.genre}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] uppercase">
                      {track.format}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">
                      {formatFileSize(track.fileSize)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-foreground text-sm font-medium">
                        {track.downloadCount.toLocaleString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/music/${track.slug}`} target="_blank">
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive h-8 w-8"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

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
