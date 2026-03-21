"use client";

import Link from "next/link";
import { Play, Pause } from "lucide-react";
import { usePlayerStore } from "@/store/player.store";
import type { Track } from "@/store/player.store";
import { DownloadButton } from "./DownloadButton";
import { HeartButton } from "./HeartButton";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils";

interface AlbumTrack {
  id: string;
  title: string;
  slug: string;
  r2Key: string;
  coverArt: string | null;
  duration: number | null;
  trackNumber: number | null;
  enableDownload: boolean;
}

interface AlbumTracklistProps {
  tracks: AlbumTrack[];
  currentTrackId: string;
  albumTitle: string;
  artistName: string;
  albumSlug?: string;
}

function EqualizerBarsMini() {
  return (
    <div className="flex h-3 items-end gap-[2px]">
      <span className="bg-brand w-[2px] animate-[soundloaded-equalizer_0.4s_ease_infinite] rounded-full" />
      <span className="bg-brand w-[2px] animate-[soundloaded-equalizer_0.6s_ease_infinite_0.1s] rounded-full" />
      <span className="bg-brand w-[2px] animate-[soundloaded-equalizer_0.5s_ease_infinite_0.2s] rounded-full" />
    </div>
  );
}

function TrackRow({
  track,
  index,
  isDetailTrack,
  allTracks,
  artistName,
}: {
  track: AlbumTrack;
  index: number;
  isDetailTrack: boolean;
  allTracks: AlbumTrack[];
  artistName: string;
}) {
  const { currentTrack, isPlaying, setTrack, setQueue, togglePlay } = usePlayerStore();

  const isCurrentTrack = currentTrack?.id === track.id;
  const isActivelyPlaying = isCurrentTrack && isPlaying;

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isCurrentTrack) {
      togglePlay();
      return;
    }

    const playerTracks: Track[] = allTracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: artistName,
      coverArt: t.coverArt,
      r2Key: t.r2Key,
      duration: t.duration ?? undefined,
      slug: t.slug,
    }));

    setQueue(playerTracks);
    setTrack(playerTracks[index]);
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
        isDetailTrack ? "bg-brand/10" : "hover:bg-muted/50",
        isCurrentTrack && !isDetailTrack && "bg-brand/5"
      )}
    >
      {/* Track number / Play / Equalizer */}
      <button
        type="button"
        onClick={handlePlay}
        className="relative w-6 flex-shrink-0 text-center"
        aria-label={isActivelyPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
      >
        {isActivelyPlaying ? (
          <EqualizerBarsMini />
        ) : isCurrentTrack ? (
          <Pause className="text-brand mx-auto h-4 w-4" />
        ) : (
          <>
            <span className="text-muted-foreground/60 block text-sm font-bold group-hover:hidden">
              {index + 1}
            </span>
            <Play className="text-foreground mx-auto hidden h-4 w-4 fill-current group-hover:block" />
          </>
        )}
      </button>

      {/* Title */}
      <div className="min-w-0 flex-1">
        <Link
          href={`/music/${track.slug}`}
          className={cn(
            "block truncate text-sm font-medium transition-colors hover:underline",
            isCurrentTrack
              ? "text-brand"
              : isDetailTrack
                ? "text-brand font-semibold"
                : "text-foreground"
          )}
        >
          {track.title}
        </Link>
      </div>

      {/* Duration */}
      {track.duration && (
        <span className="text-muted-foreground flex-shrink-0 text-xs">
          {formatDuration(track.duration)}
        </span>
      )}

      {/* Heart */}
      <div className="flex-shrink-0 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
        <HeartButton musicId={track.id} size={14} />
      </div>

      {/* Download — always visible on mobile, hover on desktop */}
      {track.enableDownload && (
        <div className="flex-shrink-0 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
          <DownloadButton
            musicId={track.id}
            title={track.title}
            enabled={track.enableDownload}
            size="sm"
            variant="ghost"
          />
        </div>
      )}
    </div>
  );
}

export function AlbumTracklist({
  tracks,
  currentTrackId,
  albumTitle,
  artistName,
  albumSlug,
}: AlbumTracklistProps) {
  if (tracks.length <= 1) return null;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-foreground text-lg font-bold">
          More from <span className="text-brand">{albumTitle}</span>
        </h2>
        {albumSlug && (
          <Link
            href={`/albums/${albumSlug}`}
            className="text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors"
          >
            View album
          </Link>
        )}
      </div>
      <div className="space-y-0.5">
        {tracks.map((track, idx) => (
          <TrackRow
            key={track.id}
            track={track}
            index={idx}
            isDetailTrack={track.id === currentTrackId}
            allTracks={tracks}
            artistName={artistName}
          />
        ))}
      </div>
    </div>
  );
}
