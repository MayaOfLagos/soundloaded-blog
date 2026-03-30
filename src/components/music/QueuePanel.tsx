"use client";

import Image from "next/image";
import { X, Music, GripVertical, ListMusic, Clock3, Play } from "lucide-react";
import { usePlayerStore } from "@/store/player.store";
import { cn } from "@/lib/utils";
import type { Track } from "@/store/player.store";

function QueueTrackRow({
  track,
  onRemove,
  onPlay,
  isPlaying,
  showDrag,
}: {
  track: Track;
  onRemove?: () => void;
  onPlay: () => void;
  isPlaying?: boolean;
  showDrag?: boolean;
}) {
  return (
    <div
      className={cn(
        "group/row hover:bg-muted/50 flex items-center gap-2.5 px-4 py-2.5 transition-colors",
        isPlaying && "bg-brand/5"
      )}
    >
      {showDrag && (
        <GripVertical className="text-muted-foreground/40 h-3.5 w-3.5 flex-shrink-0 cursor-grab" />
      )}
      <button
        type="button"
        onClick={onPlay}
        className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg"
      >
        {track.coverArt ? (
          <Image src={track.coverArt} alt="" fill className="object-cover" sizes="40px" />
        ) : (
          <div className="from-brand/10 to-muted flex h-full w-full items-center justify-center bg-gradient-to-br">
            <Music className="text-muted-foreground/40 h-4 w-4" />
          </div>
        )}
        {/* Hover play/pause overlay + active equalizer */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 transition-opacity",
            isPlaying ? "opacity-100" : "opacity-0 group-hover/row:opacity-100"
          )}
        >
          {isPlaying ? (
            <div className="flex h-3.5 items-end gap-[2px]">
              <span className="w-[2.5px] animate-[soundloaded-equalizer_0.4s_ease_infinite] rounded-full bg-white" />
              <span className="w-[2.5px] animate-[soundloaded-equalizer_0.6s_ease_infinite_0.1s] rounded-full bg-white" />
              <span className="w-[2.5px] animate-[soundloaded-equalizer_0.5s_ease_infinite_0.2s] rounded-full bg-white" />
            </div>
          ) : (
            <Play className="h-4 w-4 text-white" fill="white" strokeWidth={0} />
          )}
        </div>
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-[13px] leading-tight font-semibold",
            isPlaying ? "text-brand" : "text-foreground"
          )}
        >
          {track.title}
        </p>
        <p className="text-muted-foreground mt-0.5 truncate text-[11px]">{track.artist}</p>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-muted-foreground hover:text-foreground flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full opacity-0 transition-opacity group-hover/row:opacity-100"
          aria-label="Remove"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export function QueuePanel() {
  const {
    currentTrack,
    userQueue,
    contextQueue,
    contextLabel,
    playHistory,
    setTrack,
    removeFromUserQueue,
    removeFromContextQueue,
    clearUserQueue,
    toggleQueueOpen,
  } = usePlayerStore();

  const currentIdx = contextQueue.findIndex((t) => t.id === currentTrack?.id);
  const upcomingContext = currentIdx >= 0 ? contextQueue.slice(currentIdx + 1) : contextQueue;

  return (
    <div className="scrollbar-auto-hide sticky top-16 hidden h-[calc(100vh-4rem)] space-y-5 overflow-y-auto pb-8 lg:block">
      {/* Now Playing card */}
      {currentTrack && (
        <div className="bg-card/50 ring-border/40 overflow-hidden rounded-2xl ring-1 backdrop-blur-sm">
          <div className="border-border/50 flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="bg-brand/10 flex h-7 w-7 items-center justify-center rounded-lg">
                <Music className="text-brand h-3.5 w-3.5" />
              </div>
              <h3 className="text-foreground text-sm font-bold">Now Playing</h3>
            </div>
            <button
              type="button"
              onClick={toggleQueueOpen}
              className="bg-muted text-muted-foreground hover:text-foreground rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors"
            >
              Close
            </button>
          </div>
          <QueueTrackRow track={currentTrack} onPlay={() => {}} isPlaying />
        </div>
      )}

      {/* User Queue card */}
      {userQueue.length > 0 && (
        <div className="bg-card/50 ring-border/40 overflow-hidden rounded-2xl ring-1 backdrop-blur-sm">
          <div className="border-border/50 flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10">
                <ListMusic className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <h3 className="text-foreground text-sm font-bold">Next in Queue</h3>
            </div>
            <button
              type="button"
              onClick={clearUserQueue}
              className="bg-muted text-muted-foreground hover:bg-brand/10 hover:text-brand rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="divide-border/30 divide-y">
            {userQueue.map((track) => (
              <QueueTrackRow
                key={track.id}
                track={track}
                onPlay={() => setTrack(track)}
                onRemove={() => removeFromUserQueue(track.id)}
                showDrag
              />
            ))}
          </div>
        </div>
      )}

      {/* Context Queue card */}
      {upcomingContext.length > 0 && (
        <div className="bg-card/50 ring-border/40 overflow-hidden rounded-2xl ring-1 backdrop-blur-sm">
          <div className="border-border/50 flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-500/10">
                <ListMusic className="h-3.5 w-3.5 text-green-500" />
              </div>
              <h3 className="text-foreground truncate text-sm font-bold">
                {contextLabel ? `From: ${contextLabel}` : "Up Next"}
              </h3>
            </div>
          </div>
          <div className="divide-border/30 divide-y">
            {upcomingContext.map((track) => (
              <QueueTrackRow
                key={track.id}
                track={track}
                onPlay={() => setTrack(track)}
                onRemove={() => removeFromContextQueue(track.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recently Played card */}
      {playHistory.length > 0 && (
        <div className="bg-card/50 ring-border/40 overflow-hidden rounded-2xl ring-1 backdrop-blur-sm">
          <div className="border-border/50 flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10">
                <Clock3 className="h-3.5 w-3.5 text-purple-500" />
              </div>
              <h3 className="text-foreground text-sm font-bold">Recently Played</h3>
            </div>
          </div>
          <div className="divide-border/30 divide-y">
            {playHistory.slice(0, 10).map((track) => (
              <QueueTrackRow key={track.id} track={track} onPlay={() => setTrack(track)} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!currentTrack && userQueue.length === 0 && upcomingContext.length === 0 && (
        <div className="bg-card/50 ring-border/40 flex flex-col items-center justify-center rounded-2xl py-16 text-center ring-1 backdrop-blur-sm">
          <Music className="text-muted-foreground/30 mb-3 h-10 w-10" />
          <p className="text-muted-foreground text-sm font-medium">Queue is empty</p>
          <p className="text-muted-foreground/60 mt-1 text-xs">Play a track to get started</p>
        </div>
      )}
    </div>
  );
}
