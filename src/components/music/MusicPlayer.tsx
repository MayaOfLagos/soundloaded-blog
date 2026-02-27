"use client";

import { useEffect, useRef, useState } from "react";
import { Howl } from "howler";
import Image from "next/image";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ChevronUp,
  X,
  Music,
  ListMusic,
} from "lucide-react";
import { usePlayerStore } from "@/store/player.store";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils";
import { MiniPlayer } from "./MiniPlayer";

export function MusicPlayer() {
  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    duration,
    isMinimized,
    setCurrentTime,
    setDuration,
    togglePlay,
    playNext,
    playPrev,
    setVolume,
    toggleMute,
    toggleMinimize,
    clearPlayer,
  } = usePlayerStore();

  const howlRef = useRef<Howl | null>(null);
  const animFrameRef = useRef<number>(0);
  const [seeking, setSeeking] = useState(false);

  // Load and play track when currentTrack changes
  useEffect(() => {
    if (!currentTrack) return;

    if (howlRef.current) {
      howlRef.current.stop();
      howlRef.current.unload();
    }

    const streamUrl = `/api/music/${currentTrack.id}/stream`;

    howlRef.current = new Howl({
      src: [streamUrl],
      html5: true,
      volume: isMuted ? 0 : volume,
      onload: () => {
        setDuration(howlRef.current?.duration() ?? 0);
      },
      onplay: () => {
        const tick = () => {
          if (howlRef.current?.playing()) {
            setCurrentTime(howlRef.current.seek() as number);
            animFrameRef.current = requestAnimationFrame(tick);
          }
        };
        animFrameRef.current = requestAnimationFrame(tick);
      },
      onend: () => {
        cancelAnimationFrame(animFrameRef.current);
        playNext();
      },
      onpause: () => cancelAnimationFrame(animFrameRef.current),
      onstop: () => cancelAnimationFrame(animFrameRef.current),
    });

    if (isPlaying) howlRef.current.play();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  // Sync play/pause
  useEffect(() => {
    if (!howlRef.current) return;
    if (isPlaying) howlRef.current.play();
    else howlRef.current.pause();
  }, [isPlaying]);

  // Sync volume
  useEffect(() => {
    howlRef.current?.volume(isMuted ? 0 : volume);
  }, [volume, isMuted]);

  const handleSeek = (val: number[]) => {
    const t = val[0];
    howlRef.current?.seek(t);
    setCurrentTime(t);
  };

  if (!currentTrack) return null;

  if (isMinimized) {
    return <MiniPlayer />;
  }

  return (
    <div className="border-border bg-card/95 fixed right-0 bottom-0 left-0 z-50 border-t backdrop-blur-md">
      {/* Progress bar */}
      <div className="px-4 pt-3 pb-0">
        <Slider
          min={0}
          max={duration || 1}
          step={0.5}
          value={[currentTime]}
          onValueChange={handleSeek}
          onPointerDown={() => setSeeking(true)}
          onPointerUp={() => setSeeking(false)}
          className="cursor-pointer [&_[data-slot=thumb]]:h-3 [&_[data-slot=thumb]]:w-3"
          aria-label="Seek track"
        />
        <div className="text-muted-foreground mt-0.5 flex justify-between text-[10px]">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-3 px-4 py-2">
        {/* Track info */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="bg-muted relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md">
            {currentTrack.coverArt ? (
              <Image
                src={currentTrack.coverArt}
                alt={currentTrack.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Music className="text-muted-foreground h-5 w-5" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-foreground truncate text-sm font-medium">{currentTrack.title}</p>
            <p className="text-muted-foreground truncate text-xs">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Playback controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={playPrev}
            aria-label="Previous track"
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            className="bg-brand hover:bg-brand/90 text-brand-foreground h-9 w-9 rounded-full"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={playNext}
            aria-label="Next track"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Right controls */}
        <div className="ml-auto flex items-center gap-1">
          {/* Volume (desktop only) */}
          <div className="hidden items-center gap-2 sm:flex">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="text-muted-foreground h-4 w-4" />
              ) : (
                <Volume2 className="text-muted-foreground h-4 w-4" />
              )}
            </Button>
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={[isMuted ? 0 : volume]}
              onValueChange={(v) => setVolume(v[0])}
              className="w-20"
              aria-label="Volume"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleMinimize}
            aria-label="Minimize player"
          >
            <ChevronUp className="text-muted-foreground h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={clearPlayer}
            aria-label="Close player"
          >
            <X className="text-muted-foreground h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
