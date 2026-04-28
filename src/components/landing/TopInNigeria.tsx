import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Crown, Music, Play } from "lucide-react";
import type { MusicCardData } from "@/lib/api/music";

export function TopInNigeria({ tracks }: { tracks: MusicCardData[] }) {
  if (tracks.length === 0) return null;

  return (
    <section className="py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-brand mb-1 flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
              <Crown className="h-4 w-4" />
              Top in Nigeria
            </div>
            <h2 className="text-2xl font-black sm:text-3xl">
              What Nigeria&apos;s{" "}
              <span className="bg-linear-to-r from-fuchsia-500 to-amber-400 bg-clip-text text-transparent">
                streaming
              </span>{" "}
              this week
            </h2>
          </div>
          <Link
            href="/music"
            className="text-brand hover:text-brand/80 mb-1 flex shrink-0 items-center gap-1 text-sm font-semibold transition-colors"
          >
            See full chart
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <ol className="mt-8 grid gap-2 sm:gap-3 lg:grid-cols-2 lg:gap-x-6">
          {tracks.slice(0, 10).map((track, idx) => (
            <li key={track.id}>
              <Link
                href={`/music/${track.slug}`}
                className="bg-card ring-border/40 group hover:ring-brand/40 flex items-center gap-3 rounded-2xl p-2.5 ring-1 transition-all duration-200 sm:gap-4 sm:p-3"
              >
                {/* Rank */}
                <span className="text-muted-foreground/70 group-hover:text-brand w-7 shrink-0 text-center text-xl font-black tabular-nums transition-colors sm:w-9 sm:text-2xl">
                  {idx + 1}
                </span>

                {/* Cover */}
                <div className="bg-muted relative h-12 w-12 shrink-0 overflow-hidden rounded-lg sm:h-14 sm:w-14">
                  {track.coverArt ? (
                    <Image
                      src={track.coverArt}
                      alt={track.title}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <div className="from-brand/20 to-muted flex h-full w-full items-center justify-center bg-linear-to-br">
                      <Music className="text-muted-foreground/60 h-5 w-5" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <Play className="h-4 w-4 fill-current text-white" />
                  </div>
                </div>

                {/* Title + artist */}
                <div className="min-w-0 flex-1">
                  <p className="text-foreground group-hover:text-brand line-clamp-1 text-sm font-bold transition-colors">
                    {track.title}
                  </p>
                  <p className="text-muted-foreground line-clamp-1 text-xs">
                    {track.artistName}
                    {track.genre && (
                      <span className="text-muted-foreground/60"> · {track.genre}</span>
                    )}
                  </p>
                </div>

                {/* Streams (hidden on smallest) */}
                <span className="text-muted-foreground/70 hidden shrink-0 text-xs tabular-nums sm:block">
                  {formatStreams(track.streamCount)} plays
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function formatStreams(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}
