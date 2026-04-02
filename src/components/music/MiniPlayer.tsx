"use client";

import Image from "next/image";
import { Play, Pause, Music, ChevronUp } from "lucide-react";
import { usePlayerStore } from "@/store/player.store";
import { useDominantColor } from "@/hooks/useDominantColor";
import { HeartButton } from "./HeartButton";

export function MiniPlayer() {
  const { currentTrack, isPlaying, currentTime, duration, togglePlay, toggleMinimize } =
    usePlayerStore();
  const dominantColor = useDominantColor(currentTrack?.coverArt);

  if (!currentTrack) return null;

  const progress = duration > 0 ? currentTime / duration : 0;
  // Darken the dominant color to 60% intensity for a dimmer bg
  const mobileBg = dominantColor
    ? `rgb(${dominantColor
        .split(",")
        .map((c) => Math.round(Number(c.trim()) * 0.6))
        .join(",")})`
    : "var(--brand)";

  const cover = (
    <button
      type="button"
      onClick={toggleMinimize}
      className="relative h-10 w-10 flex-shrink-0 self-center overflow-hidden rounded"
      aria-label="Expand player"
    >
      {currentTrack.coverArt ? (
        <Image
          src={currentTrack.coverArt}
          alt={currentTrack.title}
          fill
          className="object-cover object-center"
        />
      ) : (
        <div className="bg-muted flex h-full w-full items-center justify-center">
          <Music className="text-muted-foreground h-5 w-5" />
        </div>
      )}
    </button>
  );

  const playBtn = (playing: boolean, textClass: string) => (
    <button
      type="button"
      onClick={togglePlay}
      className={`flex items-center px-2 ${textClass}`}
      aria-label={playing ? "Pause" : "Play"}
    >
      {playing ? (
        <Pause className="h-[22px] w-[22px]" fill="currentColor" strokeWidth={0} />
      ) : (
        <Play className="h-[22px] w-[22px]" fill="currentColor" strokeWidth={0} />
      )}
    </button>
  );

  return (
    <>
      {/* Mobile — dominant color bg */}
      <div className="fixed inset-x-0 z-50 md:hidden" style={{ bottom: "4rem" }}>
        <div
          className="relative mx-2 grid h-14 items-center gap-x-2 overflow-hidden rounded-xl px-2 shadow-lg transition-colors duration-500"
          style={{ backgroundColor: mobileBg, gridTemplateColumns: "auto 1fr auto" }}
        >
          <div className="absolute right-0 bottom-0 left-0 h-[2px] bg-white/30">
            <div
              className="h-full origin-left bg-white transition-transform duration-100 ease-linear"
              style={{ transform: `scaleX(${progress})` }}
            />
          </div>
          {cover}
          <button
            type="button"
            onClick={toggleMinimize}
            className="min-w-0 self-center overflow-hidden text-left"
            aria-label="Expand player"
          >
            <p className="truncate text-[13px] font-bold whitespace-nowrap text-white">
              {currentTrack.title}
            </p>
            <p className="truncate text-[11px] whitespace-nowrap text-white/70">
              {currentTrack.artist}
            </p>
          </button>
          <div className="flex items-center gap-2">
            <HeartButton
              musicId={currentTrack.id}
              size={20}
              className="p-2 text-white/70 hover:text-white [&_.heart-icon]:text-white/70 [&_.heart-icon.fill-red-500]:text-red-500"
            />
            {playBtn(isPlaying, "text-white")}
          </div>
        </div>
      </div>

      {/* Desktop — anchored panel bottom-right */}
      <div className="border-border bg-card/95 fixed right-0 bottom-0 z-50 hidden w-[340px] overflow-hidden rounded-tl-xl border-t border-l shadow-2xl backdrop-blur-md md:block">
        <div className="relative flex items-center gap-3 px-4 py-3">
          <div className="bg-border absolute top-0 right-0 left-0 h-[2px]">
            <div
              className="bg-brand h-full origin-left transition-transform duration-100 ease-linear"
              style={{ transform: `scaleX(${progress})` }}
            />
          </div>
          {cover}
          <button
            type="button"
            onClick={toggleMinimize}
            className="min-w-0 flex-1 text-left"
            aria-label="Expand player"
          >
            <p className="text-foreground truncate text-[13px] font-semibold">
              {currentTrack.title}
            </p>
            <p className="text-muted-foreground truncate text-[11px]">{currentTrack.artist}</p>
          </button>
          <div className="flex items-center gap-1">
            {playBtn(isPlaying, "text-foreground")}
            <button
              type="button"
              onClick={toggleMinimize}
              className="text-muted-foreground hover:text-foreground flex items-center p-1 transition-colors"
              aria-label="Expand player"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
