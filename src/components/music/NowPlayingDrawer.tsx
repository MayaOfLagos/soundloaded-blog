"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Loader2,
  ChevronDown,
  ListOrdered,
  Music,
} from "lucide-react";
import { Drawer as VaulDrawer } from "vaul";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { usePlayerStore } from "@/store/player.store";
import { useDominantColor } from "@/hooks/useDominantColor";
import { HeartButton } from "./HeartButton";
import { ShareButton } from "./ShareButton";
import { Slider } from "@/components/ui/slider";
import { formatDuration } from "@/lib/utils";

interface NowPlayingDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSeek: (val: number[]) => void;
}

export function NowPlayingDrawer({ open, onOpenChange, onSeek }: NowPlayingDrawerProps) {
  const {
    currentTrack,
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    shuffle,
    repeatMode,
    togglePlay,
    playNext,
    playPrev,
    toggleShuffle,
    cycleRepeat,
    toggleQueueOpen,
  } = usePlayerStore();

  const dominantColor = useDominantColor(currentTrack?.coverArt);

  if (!currentTrack) return null;

  // Build a gradient from dominant color → dark
  const gradientBg = dominantColor
    ? `linear-gradient(to bottom, rgb(${dominantColor}) 0%, rgba(${dominantColor
        .split(",")
        .map((c) => Math.round(Number(c.trim()) * 0.5))
        .join(",")}) 50%, rgb(18, 18, 18) 100%)`
    : "linear-gradient(to bottom, #333 0%, #121212 100%)";

  return (
    <VaulDrawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <VaulDrawer.Portal>
        <VaulDrawer.Overlay className="fixed inset-0 z-60 bg-black/60" />
        <VaulDrawer.Content
          className="fixed inset-x-0 bottom-0 z-60 flex h-dvh flex-col outline-none"
          style={{ background: gradientBg }}
        >
          <VisuallyHidden>
            <VaulDrawer.Title>Now Playing</VaulDrawer.Title>
          </VisuallyHidden>

          {/* Drag handle */}
          <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-white/30" />

          {/* Header */}
          <div className="flex shrink-0 items-center justify-between px-6 pt-2 pb-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:text-white active:scale-95"
              aria-label="Close now playing"
            >
              <ChevronDown className="h-6 w-6" />
            </button>
            <span className="text-[11px] font-semibold tracking-widest text-white/50 uppercase">
              Now Playing
            </span>
            <button
              type="button"
              onClick={() => {
                toggleQueueOpen();
                onOpenChange(false);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:text-white active:scale-95"
              aria-label="Queue"
            >
              <ListOrdered className="h-5 w-5" />
            </button>
          </div>

          {/* Album art — takes available space */}
          <div className="flex min-h-0 flex-1 items-center justify-center px-10 py-4">
            <div className="relative aspect-square w-full max-w-85 overflow-hidden rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
              {currentTrack.coverArt ? (
                <Image
                  src={currentTrack.coverArt}
                  alt={currentTrack.title}
                  fill
                  sizes="340px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/10">
                  <Music className="h-20 w-20 text-white/20" />
                </div>
              )}
            </div>
          </div>

          {/* Bottom section: track info + seek + controls */}
          <div className="flex shrink-0 flex-col gap-5 px-8 pt-2 pb-12">
            {/* Track info + heart */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/music/${currentTrack.slug}`}
                  onClick={() => onOpenChange(false)}
                  className="block truncate text-lg leading-tight font-bold text-white hover:underline"
                >
                  {currentTrack.title}
                </Link>
                {currentTrack.artistSlug ? (
                  <Link
                    href={`/artists/${currentTrack.artistSlug}`}
                    onClick={() => onOpenChange(false)}
                    className="mt-0.5 block truncate text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {currentTrack.artist}
                  </Link>
                ) : (
                  <p className="mt-0.5 truncate text-sm text-white/60">{currentTrack.artist}</p>
                )}
              </div>
              <HeartButton
                musicId={currentTrack.id}
                size={24}
                className="mt-0.5 shrink-0 text-white/60 hover:text-white [&_.heart-icon]:text-white/60 [&_.heart-icon.fill-red-500]:text-red-500"
              />
            </div>

            {/* Seek slider + times */}
            <div className="flex flex-col gap-1.5">
              <Slider
                min={0}
                max={duration || 1}
                step={0.5}
                value={[currentTime]}
                onValueChange={onSeek}
                className="cursor-pointer text-white"
                trackClassName="bg-white/20 h-1"
                rangeClassName="bg-white group-hover:bg-white"
                thumbClassName="bg-white opacity-100"
                aria-label="Seek"
              />
              <div className="flex justify-between">
                <span className="text-[11px] text-white/40 tabular-nums">
                  {formatDuration(currentTime)}
                </span>
                <span className="text-[11px] text-white/40 tabular-nums">
                  {formatDuration(duration)}
                </span>
              </div>
            </div>

            {/* Playback controls */}
            <div className="flex items-center justify-between px-2">
              <button
                type="button"
                onClick={toggleShuffle}
                className={`flex h-11 w-11 items-center justify-center rounded-full transition-all active:scale-90 ${
                  shuffle ? "text-green-400" : "text-white/40 hover:text-white/70"
                }`}
                aria-label={shuffle ? "Disable shuffle" : "Enable shuffle"}
              >
                <Shuffle className="h-5.5 w-5.5" />
              </button>
              <button
                type="button"
                onClick={playPrev}
                className="flex h-12 w-12 items-center justify-center text-white transition-transform active:scale-90"
                aria-label="Previous"
              >
                <SkipBack className="h-7 w-7" fill="currentColor" />
              </button>
              <button
                type="button"
                onClick={togglePlay}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-black shadow-lg transition-transform active:scale-90"
                aria-label={isBuffering ? "Loading" : isPlaying ? "Pause" : "Play"}
              >
                {isBuffering ? (
                  <Loader2 className="h-7 w-7 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-8 w-8" fill="currentColor" strokeWidth={0} />
                ) : (
                  <Play className="h-8 w-8 translate-x-0.5" fill="currentColor" strokeWidth={0} />
                )}
              </button>
              <button
                type="button"
                onClick={playNext}
                className="flex h-12 w-12 items-center justify-center text-white transition-transform active:scale-90"
                aria-label="Next"
              >
                <SkipForward className="h-7 w-7" fill="currentColor" />
              </button>
              <button
                type="button"
                onClick={cycleRepeat}
                className={`relative flex h-11 w-11 items-center justify-center rounded-full transition-all active:scale-90 ${
                  repeatMode !== "off" ? "text-green-400" : "text-white/40 hover:text-white/70"
                }`}
                aria-label={`Repeat: ${repeatMode}`}
              >
                {repeatMode === "one" ? (
                  <Repeat1 className="h-5.5 w-5.5" />
                ) : (
                  <Repeat className="h-5.5 w-5.5" />
                )}
              </button>
            </div>

            {/* Bottom action row */}
            <div className="flex items-center justify-center gap-6">
              <ShareButton
                title={currentTrack.title}
                artist={currentTrack.artist}
                url={
                  typeof window !== "undefined"
                    ? `${window.location.origin}/music/${currentTrack.slug}`
                    : `/music/${currentTrack.slug}`
                }
                size={20}
                className="text-white/40 hover:text-white/70"
              />
            </div>
          </div>
        </VaulDrawer.Content>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  );
}
