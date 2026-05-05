"use client";

import Image from "next/image";
import Link from "next/link";
import { X, Music } from "lucide-react";
import { FallbackCover } from "@/components/common/FallbackCover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePlayerStore } from "@/store/player.store";
import { cn } from "@/lib/utils";
import type { Track } from "@/store/player.store";

function QueueRow({
  track,
  onRemove,
  onPlay,
  isPlaying,
}: {
  track: Track;
  onRemove?: () => void;
  onPlay: () => void;
  isPlaying?: boolean;
}) {
  return (
    <div
      className={cn(
        "active:bg-muted/50 flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors",
        isPlaying && "bg-muted/30"
      )}
    >
      <button
        type="button"
        onClick={onPlay}
        className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded"
      >
        {track.coverArt ? (
          <Image src={track.coverArt} alt="" fill className="object-cover" sizes="40px" />
        ) : (
          <FallbackCover size="xs" />
        )}
      </button>
      <div className="min-w-0 flex-1" onClick={onPlay}>
        <p
          className={cn(
            "truncate text-sm font-semibold",
            isPlaying ? "text-brand" : "text-foreground"
          )}
        >
          <Link href={`/music/${track.slug}`} className="hover:underline">
            {track.title}
          </Link>
        </p>
        <p className="text-muted-foreground truncate text-xs">
          {track.artistSlug ? (
            <Link
              href={`/artists/${track.artistSlug}`}
              className="hover:text-brand transition-colors"
            >
              {track.artist}
            </Link>
          ) : (
            track.artist
          )}
        </p>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-muted-foreground hover:text-foreground flex h-8 w-8 flex-shrink-0 items-center justify-center"
          aria-label="Remove"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function QueueSheet() {
  const {
    currentTrack,
    userQueue,
    contextQueue,
    contextLabel,
    playHistory,
    isQueueOpen,
    setTrack,
    removeFromUserQueue,
    removeFromContextQueue,
    clearUserQueue,
    toggleQueueOpen,
  } = usePlayerStore();

  const currentIdx = contextQueue.findIndex((t) => t.id === currentTrack?.id);
  const upcomingContext = currentIdx >= 0 ? contextQueue.slice(currentIdx + 1) : contextQueue;

  return (
    <Sheet open={isQueueOpen} onOpenChange={toggleQueueOpen}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0">
        <SheetHeader className="border-border/30 border-b px-4 py-3">
          <SheetTitle>Queue</SheetTitle>
        </SheetHeader>

        <div className="h-full overflow-y-auto pb-24">
          {/* Now Playing */}
          {currentTrack && (
            <div className="border-border/30 border-b px-4 py-3">
              <p className="text-muted-foreground mb-2 text-[10px] font-semibold tracking-wider uppercase">
                Now Playing
              </p>
              <QueueRow track={currentTrack} onPlay={() => {}} isPlaying />
            </div>
          )}

          {/* User Queue */}
          {userQueue.length > 0 && (
            <div className="border-border/30 border-b px-4 py-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                  Next in Queue
                </p>
                <button
                  type="button"
                  onClick={clearUserQueue}
                  className="text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
                >
                  Clear
                </button>
              </div>
              {userQueue.map((track) => (
                <QueueRow
                  key={track.id}
                  track={track}
                  onPlay={() => setTrack(track)}
                  onRemove={() => removeFromUserQueue(track.id)}
                />
              ))}
            </div>
          )}

          {/* Context Queue */}
          {upcomingContext.length > 0 && (
            <div className="border-border/30 border-b px-4 py-3">
              <p className="text-muted-foreground mb-2 text-[10px] font-semibold tracking-wider uppercase">
                Next From{contextLabel ? `: ${contextLabel}` : ""}
              </p>
              {upcomingContext.map((track) => (
                <QueueRow
                  key={track.id}
                  track={track}
                  onPlay={() => setTrack(track)}
                  onRemove={() => removeFromContextQueue(track.id)}
                />
              ))}
            </div>
          )}

          {/* Recently Played */}
          {playHistory.length > 0 && (
            <div className="px-4 py-3">
              <p className="text-muted-foreground mb-2 text-[10px] font-semibold tracking-wider uppercase">
                Recently Played
              </p>
              {playHistory.slice(0, 15).map((track) => (
                <QueueRow key={track.id} track={track} onPlay={() => setTrack(track)} />
              ))}
            </div>
          )}

          {/* Empty */}
          {!currentTrack && userQueue.length === 0 && upcomingContext.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Music className="text-muted-foreground/30 mb-3 h-12 w-12" />
              <p className="text-muted-foreground font-medium">Queue is empty</p>
              <p className="text-muted-foreground/60 mt-1 text-sm">Play a track to get started</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
