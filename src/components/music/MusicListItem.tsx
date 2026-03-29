"use client";

import Link from "next/link";
import Image from "next/image";
import { Play, Music, Headphones } from "lucide-react";
import { usePlayerStore } from "@/store/player.store";
import { cn } from "@/lib/utils";
import { HeartButton } from "./HeartButton";
import type { MusicCardData } from "@/lib/api/music";
import type { Track } from "@/store/player.store";

interface MusicListItemProps {
  track: MusicCardData;
  rank: number;
  listTracks?: MusicCardData[];
  listLabel?: string;
}

function toPlayerTrack(t: MusicCardData): Track {
  return {
    id: t.id,
    title: t.title,
    artist: t.artistName,
    coverArt: t.coverArt ?? null,
    r2Key: t.r2Key,
    duration: 0,
    slug: t.slug,
  };
}

function EqualizerBars() {
  return (
    <div className="flex h-3 items-end gap-[2px]">
      <span className="bg-brand w-[2.5px] animate-[soundloaded-equalizer_0.4s_ease_infinite] rounded-full" />
      <span className="bg-brand w-[2.5px] animate-[soundloaded-equalizer_0.6s_ease_infinite_0.1s] rounded-full" />
      <span className="bg-brand w-[2.5px] animate-[soundloaded-equalizer_0.5s_ease_infinite_0.2s] rounded-full" />
    </div>
  );
}

export function MusicListItem({ track, rank, listTracks, listLabel }: MusicListItemProps) {
  const { currentTrack, isPlaying, setTrack, setContextQueue, togglePlay } = usePlayerStore();

  const isCurrentTrack = currentTrack?.id === track.id;
  const isActivelyPlaying = isCurrentTrack && isPlaying;

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isCurrentTrack) {
      togglePlay();
      return;
    }

    if (listTracks?.length) {
      setContextQueue(listTracks.map(toPlayerTrack), listLabel || "");
    }
    setTrack(toPlayerTrack(track));
  };

  return (
    <div
      className={cn(
        "group/item hover:bg-muted/50 flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors",
        isCurrentTrack && "bg-muted/30"
      )}
    >
      {/* Rank number / play button */}
      <button
        type="button"
        onClick={handlePlay}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center"
        aria-label={isActivelyPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
      >
        {isActivelyPlaying ? (
          <EqualizerBars />
        ) : (
          <>
            <span className="text-muted-foreground block text-base font-bold tabular-nums group-hover/item:hidden">
              {rank}
            </span>
            <Play
              className="text-foreground hidden h-4 w-4 group-hover/item:block"
              fill="currentColor"
              strokeWidth={0}
            />
          </>
        )}
      </button>

      {/* Cover art */}
      <Link
        href={`/music/${track.slug}`}
        className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded"
      >
        {track.coverArt ? (
          <Image
            src={track.coverArt}
            alt={track.title}
            fill
            className="object-cover"
            sizes="40px"
          />
        ) : (
          <div className="from-brand/10 to-muted flex h-full w-full items-center justify-center bg-gradient-to-br">
            <Music className="text-muted-foreground/40 h-4 w-4" />
          </div>
        )}
      </Link>

      {/* Title + artist */}
      <div className="min-w-0 flex-1">
        <Link
          href={`/music/${track.slug}`}
          className={cn(
            "block truncate text-sm font-semibold transition-colors hover:underline",
            isCurrentTrack ? "text-brand" : "text-foreground"
          )}
        >
          {track.title}
        </Link>
        <p className="text-muted-foreground truncate text-xs">{track.artistName}</p>
      </div>

      {/* Stream count */}
      <div className="text-muted-foreground hidden items-center gap-1 text-xs tabular-nums sm:flex">
        <Headphones className="h-3 w-3" />
        <span>{track.streamCount.toLocaleString()}</span>
      </div>

      {/* Heart button */}
      <HeartButton
        musicId={track.id}
        size={16}
        className="flex-shrink-0 opacity-0 transition-opacity group-hover/item:opacity-100"
      />
    </div>
  );
}
