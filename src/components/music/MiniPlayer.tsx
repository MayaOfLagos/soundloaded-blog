"use client";

import Image from "next/image";
import { Play, Pause, SkipForward, ChevronDown, Music } from "lucide-react";
import { usePlayerStore } from "@/store/player.store";
import { Button } from "@/components/ui/button";

export function MiniPlayer() {
  const { currentTrack, isPlaying, togglePlay, playNext, toggleMinimize } = usePlayerStore();

  if (!currentTrack) return null;

  return (
    <div className="border-border bg-card/95 fixed right-0 bottom-0 left-0 z-50 border-t backdrop-blur-md">
      <div className="flex h-14 items-center gap-3 px-4 py-2">
        {/* Track info */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="bg-muted relative h-8 w-8 flex-shrink-0 overflow-hidden rounded">
            {currentTrack.coverArt ? (
              <Image
                src={currentTrack.coverArt}
                alt={currentTrack.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Music className="text-muted-foreground h-4 w-4" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-foreground truncate text-xs font-medium">{currentTrack.title}</p>
            <p className="text-muted-foreground truncate text-[11px]">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            className="bg-brand hover:bg-brand/90 text-brand-foreground h-8 w-8 rounded-full"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={playNext}
            aria-label="Next"
          >
            <SkipForward className="text-muted-foreground h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleMinimize}
            aria-label="Expand player"
          >
            <ChevronDown className="text-muted-foreground h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
