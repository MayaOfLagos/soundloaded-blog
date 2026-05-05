import Link from "next/link";
import Image from "next/image";
import { Music, Download } from "lucide-react";
import { FallbackCover } from "@/components/common/FallbackCover";
import { getMoreFromArtist } from "@/lib/api/posts";
import { formatDuration } from "@/lib/utils";

interface MoreFromArtistProps {
  artistId: string;
  artistName: string;
  excludeMusicId: string;
}

export async function MoreFromArtist({
  artistId,
  artistName,
  excludeMusicId,
}: MoreFromArtistProps) {
  const tracks = await getMoreFromArtist(artistId, excludeMusicId, 5);

  if (tracks.length === 0) return null;

  return (
    <div className="bg-card/50 ring-border/40 overflow-hidden rounded-2xl ring-1 backdrop-blur-sm">
      <div className="border-border/50 flex items-center gap-2 border-b px-4 py-3">
        <div className="bg-brand/10 flex h-7 w-7 items-center justify-center rounded-lg">
          <Music className="text-brand h-3.5 w-3.5" />
        </div>
        <h3 className="text-foreground text-sm font-bold">More from {artistName}</h3>
      </div>

      <div className="divide-border/30 divide-y">
        {tracks.map((track) => (
          <Link
            key={track.id}
            href={`/music/${track.slug}`}
            className="group hover:bg-muted/50 flex items-center gap-3 px-4 py-2.5 transition-colors"
          >
            <div className="bg-muted relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg">
              {track.coverArt ? (
                <Image
                  src={track.coverArt}
                  alt={track.title}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              ) : (
                <FallbackCover size="xs" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-foreground group-hover:text-brand truncate text-[13px] font-semibold transition-colors">
                {track.title}
              </p>
              {track.duration && (
                <p className="text-muted-foreground text-[11px]">
                  {formatDuration(track.duration)}
                </p>
              )}
            </div>

            <div className="bg-muted text-muted-foreground flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold">
              <Download className="h-3 w-3" />
              {track.downloadCount.toLocaleString()}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
