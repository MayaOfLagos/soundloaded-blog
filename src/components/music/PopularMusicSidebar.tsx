import Link from "next/link";
import Image from "next/image";
import { Download, Play } from "lucide-react";
import { FallbackCover } from "@/components/common/FallbackCover";
import { getPopularMusic } from "@/lib/api/music";

export async function PopularMusicSidebar() {
  const tracks = await getPopularMusic({ limit: 5 });

  return (
    <div className="bg-card/50 ring-border/40 overflow-hidden rounded-2xl ring-1 backdrop-blur-sm">
      {/* Header */}
      <div className="border-border/50 flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="bg-brand/10 flex h-7 w-7 items-center justify-center rounded-lg">
            <Download className="text-brand h-3.5 w-3.5" />
          </div>
          <h3 className="text-foreground text-sm font-bold">Hot Downloads</h3>
        </div>
        <Link
          href="/music"
          className="bg-muted text-muted-foreground hover:bg-brand/10 hover:text-brand rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors"
        >
          See all
        </Link>
      </div>

      {tracks.length === 0 ? (
        <p className="text-muted-foreground px-4 py-8 text-center text-xs">
          No music uploaded yet.
        </p>
      ) : (
        <div className="divide-border/30 divide-y">
          {tracks.map((track, idx) => (
            <Link
              key={track.id}
              href={`/music/${track.slug}`}
              className="group hover:bg-muted/50 flex items-center gap-3 px-4 py-2.5 transition-colors"
            >
              {/* Rank */}
              <span className="text-muted-foreground/60 w-5 flex-shrink-0 text-center text-xs font-black">
                {idx + 1}
              </span>

              {/* Album art with play overlay */}
              <div className="bg-muted relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-xl">
                {track.coverArt ? (
                  <Image
                    src={track.coverArt}
                    alt={track.title}
                    fill
                    className="object-cover"
                    sizes="44px"
                  />
                ) : (
                  <FallbackCover size="xs" />
                )}
                {/* Play overlay on hover */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Play className="h-4 w-4 fill-white text-white" />
                </div>
              </div>

              {/* Track info */}
              <div className="min-w-0 flex-1">
                <p className="text-foreground group-hover:text-brand truncate text-[13px] font-semibold transition-colors">
                  {track.title}
                </p>
                <p className="text-muted-foreground truncate text-[11px]">{track.artistName}</p>
              </div>

              {/* Download count */}
              <div className="bg-muted text-muted-foreground flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold">
                <Download className="h-3 w-3" />
                {track.downloadCount.toLocaleString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
