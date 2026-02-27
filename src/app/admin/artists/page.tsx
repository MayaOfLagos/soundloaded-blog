import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Plus, Mic2, Pencil, Trash2, Instagram, Twitter } from "lucide-react";
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

export const metadata: Metadata = { title: "Artists — Soundloaded Admin" };

const PAGE_SIZE = 25;

interface ArtistsPageProps {
  searchParams: Promise<{ page?: string; q?: string }>;
}

async function getArtists({ page, q }: { page: number; q?: string }) {
  try {
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
        orderBy: { name: "asc" },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
        include: {
          _count: {
            select: { music: true, albums: true },
          },
        },
      }),
      db.artist.count({ where }),
    ]);

    return { artists, total };
  } catch {
    return { artists: [], total: 0 };
  }
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
      if (v && v !== "1") p.set(k, v);
    });
    return `/admin/artists?${p.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-black">Artists</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {total.toLocaleString()} artist{total !== 1 ? "s" : ""} in the database
          </p>
        </div>
        <Link href="/admin/artists/new">
          <Button className="bg-brand hover:bg-brand/90 text-brand-foreground gap-1.5">
            <Plus className="h-4 w-4" />
            Add Artist
          </Button>
        </Link>
      </div>

      {/* Search */}
      <form method="GET" action="/admin/artists">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search artists..."
          className="border-input bg-card ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full max-w-sm rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
        />
      </form>

      {/* Table */}
      <div className="border-border bg-card overflow-hidden rounded-xl border">
        {artists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Mic2 className="text-muted-foreground/30 mb-3 h-12 w-12" />
            <p className="text-muted-foreground font-medium">No artists found</p>
            <p className="text-muted-foreground/70 mt-1 text-sm">
              Add your first artist to get started
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-12">Photo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Genre</TableHead>
                <TableHead>Country</TableHead>
                <TableHead className="text-center">Songs</TableHead>
                <TableHead className="text-center">Albums</TableHead>
                <TableHead>Socials</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {artists.map((artist) => (
                <TableRow key={artist.id} className="border-border">
                  <TableCell>
                    <div className="bg-muted relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full">
                      {artist.photo ? (
                        <Image
                          src={artist.photo}
                          alt={artist.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Mic2 className="text-muted-foreground/50 h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-foreground text-sm font-semibold">{artist.name}</p>
                      <p className="text-muted-foreground text-xs">/{artist.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {artist.genre ? (
                      <Badge variant="secondary" className="text-[10px]">
                        {artist.genre}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">
                      {artist.country ?? "Nigeria"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-foreground text-sm font-medium">
                      {artist._count.music}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-foreground text-sm font-medium">
                      {artist._count.albums}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {artist.instagram && (
                        <a
                          href={`https://instagram.com/${artist.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Instagram className="text-muted-foreground hover:text-brand h-3.5 w-3.5 transition-colors" />
                        </a>
                      )}
                      {artist.twitter && (
                        <a
                          href={`https://x.com/${artist.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Twitter className="text-muted-foreground hover:text-brand h-3.5 w-3.5 transition-colors" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/artists/${artist.id}`}>
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
