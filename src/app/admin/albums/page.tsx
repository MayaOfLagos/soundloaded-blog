import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Plus, Disc3, Pencil, Trash2 } from "lucide-react";
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
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Albums — Soundloaded Admin" };

const PAGE_SIZE = 25;

const TYPE_COLORS: Record<string, string> = {
  ALBUM: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  EP: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  MIXTAPE: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  COMPILATION: "bg-teal-500/10 text-teal-600 border-teal-500/20",
};

interface AlbumsPageProps {
  searchParams: Promise<{ page?: string; q?: string }>;
}

async function getAlbums({ page, q }: { page: number; q?: string }) {
  try {
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
        orderBy: { releaseDate: "desc" },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
        include: {
          artist: { select: { name: true, slug: true } },
          _count: { select: { tracks: true } },
        },
      }),
      db.album.count({ where }),
    ]);

    return { albums, total };
  } catch {
    return { albums: [], total: 0 };
  }
}

export default async function AlbumsPage({ searchParams }: AlbumsPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const q = params.q ?? "";

  const { albums, total } = await getAlbums({ page, q });
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { page: String(page), q, ...overrides };
    Object.entries(merged).forEach(([k, v]) => {
      if (v && v !== "1") p.set(k, v);
    });
    return `/admin/albums?${p.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-black">Albums</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {total.toLocaleString()} album{total !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link href="/admin/albums/new">
          <Button className="bg-brand hover:bg-brand/90 text-brand-foreground gap-1.5">
            <Plus className="h-4 w-4" />
            Add Album
          </Button>
        </Link>
      </div>

      {/* Search */}
      <form method="GET" action="/admin/albums">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search albums..."
          className="border-input bg-card ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full max-w-sm rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
        />
      </form>

      {/* Table */}
      <div className="border-border bg-card overflow-hidden rounded-xl border">
        {albums.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Disc3 className="text-muted-foreground/30 mb-3 h-12 w-12" />
            <p className="text-muted-foreground font-medium">No albums found</p>
            <p className="text-muted-foreground/70 mt-1 text-sm">
              Add your first album to get started
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-12">Cover</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Artist</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Genre</TableHead>
                <TableHead>Released</TableHead>
                <TableHead className="text-center">Tracks</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {albums.map((album) => (
                <TableRow key={album.id} className="border-border">
                  <TableCell>
                    <div className="bg-muted relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md">
                      {album.coverArt ? (
                        <Image
                          src={album.coverArt}
                          alt={album.title}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Disc3 className="text-muted-foreground/50 h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-foreground line-clamp-1 text-sm font-semibold">
                        {album.title}
                      </p>
                      <p className="text-muted-foreground text-xs">/{album.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/artists/${album.artist.slug}`}
                      target="_blank"
                      className="text-muted-foreground hover:text-brand text-sm transition-colors"
                    >
                      {album.artist.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase ${TYPE_COLORS[album.type] ?? ""}`}
                    >
                      {album.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">{album.genre ?? "—"}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">
                      {album.releaseDate ? formatDate(album.releaseDate) : "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-foreground text-sm font-medium">
                      {album._count.tracks}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/albums/${album.id}`}>
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
