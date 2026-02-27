import Link from "next/link";
import Image from "next/image";
import { Mic2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ArtistCardData } from "@/lib/api/music";

interface ArtistCardProps {
  artist: ArtistCardData;
}

export function ArtistCard({ artist }: ArtistCardProps) {
  return (
    <Link
      href={`/artists/${artist.slug}`}
      className="group border-border bg-card hover:border-brand/30 flex flex-col items-center rounded-xl border p-4 text-center transition-all hover:shadow-sm"
    >
      {/* Photo */}
      <div className="bg-muted ring-border group-hover:ring-brand/50 relative mb-3 h-20 w-20 overflow-hidden rounded-full ring-2 transition-all">
        {artist.photo ? (
          <Image src={artist.photo} alt={artist.name} fill className="object-cover" sizes="80px" />
        ) : (
          <div className="from-brand/10 to-muted flex h-full w-full items-center justify-center bg-gradient-to-br">
            <Mic2 className="text-muted-foreground/50 h-8 w-8" />
          </div>
        )}
      </div>

      <p className="text-foreground group-hover:text-brand line-clamp-1 text-sm font-bold transition-colors">
        {artist.name}
      </p>

      {artist.genre && (
        <Badge variant="secondary" className="mt-1 text-[10px]">
          {artist.genre}
        </Badge>
      )}

      <p className="text-muted-foreground mt-1 text-xs">
        {artist.songCount} song{artist.songCount !== 1 ? "s" : ""}
      </p>
    </Link>
  );
}
