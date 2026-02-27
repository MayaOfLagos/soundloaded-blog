import Link from "next/link";
import Image from "next/image";
import { Disc, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AlbumCardData } from "@/lib/api/music";

interface AlbumCardProps {
  album: AlbumCardData;
}

export function AlbumCard({ album }: AlbumCardProps) {
  return (
    <Link
      href={`/albums/${album.slug}`}
      className="group border-border bg-card hover:border-brand/30 flex flex-col overflow-hidden rounded-xl border transition-all hover:shadow-sm"
    >
      {/* Cover */}
      <div className="bg-muted relative aspect-square overflow-hidden">
        {album.coverArt ? (
          <Image
            src={album.coverArt}
            alt={album.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, 33vw"
          />
        ) : (
          <div className="from-brand/10 to-muted flex h-full items-center justify-center bg-gradient-to-br">
            <Disc className="text-muted-foreground/40 h-12 w-12" />
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="text-foreground group-hover:text-brand line-clamp-1 text-sm font-bold transition-colors">
          {album.title}
        </p>
        <p className="text-muted-foreground mt-0.5 text-xs">{album.artistName}</p>

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
    </Link>
  );
}
