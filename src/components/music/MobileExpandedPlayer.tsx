"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronDown,
  X,
  Music,
  Loader2,
  ListOrdered,
} from "lucide-react";
import { usePlayerStore } from "@/store/player.store";
import { useDominantColor } from "@/hooks/useDominantColor";
import { Slider } from "@/components/ui/slider";

interface MobileExpandedPlayerProps {
  onSeek: (val: number[]) => void;
}

export function MobileExpandedPlayer({ onSeek }: MobileExpandedPlayerProps) {
  const {
    currentTrack,
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    togglePlay,
    playNext,
    playPrev,
    toggleMinimize,
    toggleQueueOpen,
    clearPlayer,
  } = usePlayerStore();

  const dominantColor = useDominantColor(currentTrack?.coverArt);

  if (!currentTrack) return null;

  // Darken the dominant color to 60% intensity for a dimmer bg
  const mobileBg = dominantColor
    ? `rgb(${dominantColor
        .split(",")
        .map((c) => Math.round(Number(c.trim()) * 0.6))
        .join(",")})`
    : "var(--brand)";

  return (
    <div
      className="fixed inset-x-0 z-50 md:hidden"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 3.5rem)" }}
    >
      <div
        className="mx-2 overflow-hidden rounded-xl shadow-lg transition-colors duration-500"
        style={{ backgroundColor: mobileBg }}
      >
        <div className="flex items-center justify-between px-3 pt-2">
          <div className="text-[10px] font-medium tracking-wide text-white/50 uppercase">
            Now Playing
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleQueueOpen}
              className="flex h-7 w-7 items-center justify-center rounded-full text-white/60 transition-colors hover:text-white"
              aria-label="Queue"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={toggleMinimize}
              className="flex h-7 w-7 items-center justify-center rounded-full text-white/60 transition-colors hover:text-white"
              aria-label="Minimize"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={clearPlayer}
              className="flex h-7 w-7 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-red-500/20 hover:text-red-400"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 px-3 pb-1">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded">
            {currentTrack.coverArt ? (
              <Image
                src={currentTrack.coverArt}
                alt={currentTrack.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-white/10">
                <Music className="h-5 w-5 text-white/60" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Link
              href={`/music/${currentTrack.slug}`}
              className="block truncate text-sm font-bold text-white hover:underline"
            >
              {currentTrack.title}
            </Link>
            {currentTrack.artistSlug ? (
              <Link
                href={`/artists/${currentTrack.artistSlug}`}
                className="block truncate text-xs text-white/70 transition-colors hover:text-white"
              >
                {currentTrack.artist}
              </Link>
            ) : (
              <p className="truncate text-xs text-white/70">{currentTrack.artist}</p>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={playPrev}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:text-white"
              aria-label="Previous"
            >
              <SkipBack className="h-4 w-4" fill="currentColor" />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition-transform active:scale-90"
              aria-label={isBuffering ? "Loading" : isPlaying ? "Pause" : "Play"}
            >
              {isBuffering ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-5 w-5" fill="currentColor" strokeWidth={0} />
              ) : (
                <Play className="h-5 w-5 translate-x-px" fill="currentColor" strokeWidth={0} />
              )}
            </button>
            <button
              type="button"
              onClick={playNext}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:text-white"
              aria-label="Next"
            >
              <SkipForward className="h-4 w-4" fill="currentColor" />
            </button>
          </div>
        </div>
        <div className="px-3 pb-2">
          <Slider
            variant="thin"
            min={0}
            max={duration || 1}
            step={0.5}
            value={[currentTime]}
            onValueChange={onSeek}
            className="cursor-pointer text-white"
            trackClassName="bg-white/30"
            rangeClassName="bg-white group-hover:bg-white"
            thumbClassName="bg-white"
            aria-label="Seek"
          />
        </div>
      </div>
    </div>
  );
}
