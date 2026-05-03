"use client";

import Link from "next/link";
import { Disc, Download } from "lucide-react";
import { CoverImage } from "@/components/common/CoverImage";
import { Badge } from "@/components/ui/badge";
import type { AlbumCardData } from "@/lib/api/music";

interface AlbumCardProps {
  album: AlbumCardData;
}

export function AlbumCard({ album }: AlbumCardProps) {
  return (
    <div className="group border-border bg-card hover:border-brand/30 flex flex-col overflow-hidden rounded-xl border transition-all hover:shadow-sm">
      {/* Cover */}
      <Link
        href={`/albums/${album.slug}`}
        className="bg-muted relative block aspect-square overflow-hidden"
      >
        {album.coverArt ? (
          <CoverImage
            src={album.coverArt}
            alt={album.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, 33vw"
          />
        ) : (
          <div className="from-brand/10 to-muted flex h-full items-center justify-center bg-linear-to-br">
            <Disc className="text-muted-foreground/40 h-12 w-12" />
          </div>
        )}
      </Link>

      <div className="p-3">
        <Link href={`/albums/${album.slug}`}>
          <p className="text-foreground group-hover:text-brand line-clamp-1 text-sm font-bold transition-colors">
            {album.title}
          </p>
        </Link>
        <Link
          href={`/artists/${album.artistSlug}`}
          className="text-muted-foreground hover:text-brand mt-0.5 block text-xs transition-colors"
        >
          {album.artistName}
        </Link>

        <div className="text-muted-foreground mt-2 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="py-0 text-[10px]">
              {album.releaseYear ?? "N/A"}
            </Badge>
            <span>{album.trackCount} tracks</span>
          </div>
          {album.totalDownloads > 0 && (
            <div className="flex items-center gap-1">
              <Download className="h-3 w-3" />
              <span>{album.totalDownloads.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
