"use client";

import Link from "next/link";
import Image from "next/image";
import { Play, Pause, Music, Loader2 } from "lucide-react";
import { usePlayerStore } from "@/store/player.store";
import { cn } from "@/lib/utils";
import { HeartButton } from "./HeartButton";
import { MusicActionMenu } from "./MusicActionMenu";
import type { MusicCardData } from "@/lib/api/music";
import type { Track } from "@/store/player.store";

interface MusicShelfCardProps {
  track: MusicCardData;
  /** All tracks in this shelf — used to set queue when playing */
  shelfTracks?: MusicCardData[];
  /** Label for the context queue (e.g. "New Releases") */
  shelfLabel?: string;
  className?: string;
}

function toPlayerTrack(t: MusicCardData): Track {
  return {
    id: t.id,
    title: t.title,
    artist: t.artistName,
    artistSlug: t.artistSlug,
    coverArt: t.coverArt ?? null,
    r2Key: t.r2Key,
    duration: 0,
    slug: t.slug,
  };
}

function EqualizerBars() {
  return (
    <div className="flex h-3.5 items-end gap-[2px]">
      <span className="bg-brand w-[3px] animate-[soundloaded-equalizer_0.4s_ease_infinite] rounded-full" />
      <span className="bg-brand w-[3px] animate-[soundloaded-equalizer_0.6s_ease_infinite_0.1s] rounded-full" />
      <span className="bg-brand w-[3px] animate-[soundloaded-equalizer_0.5s_ease_infinite_0.2s] rounded-full" />
    </div>
  );
}

export function MusicShelfCard({ track, shelfTracks, shelfLabel, className }: MusicShelfCardProps) {
  const { currentTrack, isPlaying, isBuffering, setTrack, setContextQueue, togglePlay } =
    usePlayerStore();

  const isCurrentTrack = currentTrack?.id === track.id;
  const isActivelyPlaying = isCurrentTrack && isPlaying;
  const isLoading = isCurrentTrack && isBuffering;

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isCurrentTrack) {
      togglePlay();
      return;
    }

    if (shelfTracks?.length) {
      setContextQueue(shelfTracks.map(toPlayerTrack), shelfLabel || "");
    }
    setTrack(toPlayerTrack(track));
  };

  return (
    <div className={cn("group/card hover:bg-muted/50 rounded-lg p-3 transition-colors", className)}>
      {/* Album art wrapper — relative container for both image and buttons */}
      <div className="relative aspect-square">
        {/* Image link — overflow-hidden stays here for scale zoom */}
        <Link
          href={`/music/${track.slug}`}
          className="bg-muted absolute inset-0 block overflow-hidden rounded-md"
        >
          {track.coverArt ? (
            <Image
              src={track.coverArt}
              alt={track.title}
              fill
              className="object-cover transition-transform duration-300 ease-out group-hover/card:scale-110"
              sizes="(max-width: 640px) 150px, (max-width: 1024px) 180px, 200px"
            />
          ) : (
            <div className="from-brand/10 to-muted flex h-full items-center justify-center bg-gradient-to-br">
              <Music className="text-muted-foreground/40 h-10 w-10" />
            </div>
          )}

          {/* Hover overlay gradient for button visibility */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" />
        </Link>

        {/* 3-button row: Heart | Play | Options — outside overflow-hidden so dropdown expands freely */}
        <div
          className={cn(
            "absolute top-[55%] left-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 transition-all duration-300 pointer-coarse:hidden",
            isActivelyPlaying
              ? "scale-100 opacity-100"
              : "scale-[0.6] opacity-0 group-hover/card:scale-100 group-hover/card:opacity-100"
          )}
        >
          {/* Heart / Love button */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
            <HeartButton musicId={track.id} size={18} />
          </div>

          {/* Play / Pause button (larger, center) */}
          <button
            type="button"
            onClick={handlePlay}
            className="bg-brand text-brand-foreground flex h-14 w-14 items-center justify-center rounded-full shadow-[0_8px_8px_rgba(0,0,0,0.3)] transition-transform duration-150 hover:scale-110 hover:brightness-110"
            aria-label={isActivelyPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : isActivelyPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="ml-0.5 h-6 w-6" />
            )}
          </button>

          {/* Options / More button */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
            <MusicActionMenu track={track} size={18} />
          </div>
        </div>
      </div>

      {/* Track info */}
      <div className="mt-2 min-w-0">
        <div className="flex items-center gap-1.5">
          {isActivelyPlaying && <EqualizerBars />}
          <Link
            href={`/music/${track.slug}`}
            className={cn(
              "truncate text-sm font-bold transition-colors",
              isCurrentTrack ? "text-brand" : "text-foreground hover:underline"
            )}
          >
            {track.title}
          </Link>
        </div>
        <Link
          href={`/artists/${track.artistSlug}`}
          className="text-muted-foreground hover:text-brand mt-0.5 truncate text-xs transition-colors"
        >
          {track.artistName}
        </Link>
      </div>
    </div>
  );
}
