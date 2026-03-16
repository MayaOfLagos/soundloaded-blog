"use client";

import { Play } from "lucide-react";
import { usePlayerStore } from "@/store/player.store";
import type { Track } from "@/store/player.store";
import { DownloadButton } from "./DownloadButton";
import { HeartButton } from "./HeartButton";
import { ShareButton } from "./ShareButton";
import { MusicActionMenu } from "./MusicActionMenu";
import type { MusicCardData } from "@/lib/api/music";
import { cn } from "@/lib/utils";

interface TrackActionBarProps {
  track: {
    id: string;
    title: string;
    slug: string;
    r2Key: string;
    coverArt: string | null;
    duration: number | null;
    enableDownload: boolean;
    isExclusive: boolean;
    price: number | null;
    artistName: string;
    genre: string | null;
    downloadCount: number;
    fileSize: number | null;
    releaseYear: number | null;
    albumTitle: string | null;
  };
  siteUrl: string;
  enableDownloads: boolean;
}

function EqualizerBars() {
  return (
    <div className="flex h-3.5 items-end gap-[2px]">
      <span className="bg-brand-foreground w-[3px] animate-[soundloaded-equalizer_0.4s_ease_infinite] rounded-full" />
      <span className="bg-brand-foreground w-[3px] animate-[soundloaded-equalizer_0.6s_ease_infinite_0.1s] rounded-full" />
      <span className="bg-brand-foreground w-[3px] animate-[soundloaded-equalizer_0.5s_ease_infinite_0.2s] rounded-full" />
    </div>
  );
}

export function TrackActionBar({ track, siteUrl, enableDownloads }: TrackActionBarProps) {
  const { currentTrack, isPlaying, setTrack, togglePlay } = usePlayerStore();

  const isCurrentTrack = currentTrack?.id === track.id;
  const isActivelyPlaying = isCurrentTrack && isPlaying;

  const handlePlay = () => {
    if (isCurrentTrack) {
      togglePlay();
      return;
    }
    const playerTrack: Track = {
      id: track.id,
      title: track.title,
      artist: track.artistName,
      coverArt: track.coverArt,
      r2Key: track.r2Key,
      duration: track.duration ?? undefined,
      slug: track.slug,
    };
    setTrack(playerTrack);
  };

  const musicCardData: MusicCardData = {
    id: track.id,
    slug: track.slug,
    title: track.title,
    artistName: track.artistName,
    albumTitle: track.albumTitle,
    coverArt: track.coverArt,
    genre: track.genre,
    downloadCount: track.downloadCount,
    enableDownload: track.enableDownload,
    fileSize: track.fileSize ? BigInt(track.fileSize) : null,
    releaseYear: track.releaseYear,
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Play / Pause — primary CTA */}
      <button
        type="button"
        onClick={handlePlay}
        className={cn(
          "flex h-11 min-w-[120px] items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-all duration-150 hover:scale-105 hover:brightness-110",
          "bg-brand text-brand-foreground shadow-lg"
        )}
        aria-label={isActivelyPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
      >
        {isActivelyPlaying ? (
          <>
            <EqualizerBars />
            <span>Playing</span>
          </>
        ) : isCurrentTrack ? (
          <>
            <Play className="ml-0.5 h-4 w-4" />
            <span>Resume</span>
          </>
        ) : (
          <>
            <Play className="ml-0.5 h-4 w-4" />
            <span>Play</span>
          </>
        )}
      </button>

      {/* Download */}
      {enableDownloads && track.enableDownload && (
        <DownloadButton
          musicId={track.id}
          title={track.title}
          enabled={track.enableDownload}
          isExclusive={track.isExclusive}
          price={track.price ?? undefined}
          size="default"
          className="h-11 rounded-full"
        />
      )}

      {/* Heart / Like */}
      <div className="bg-muted hover:bg-muted/80 flex h-11 w-11 items-center justify-center rounded-full transition-colors">
        <HeartButton musicId={track.id} size={22} />
      </div>

      {/* Share */}
      <ShareButton
        title={track.title}
        artist={track.artistName}
        url={`${siteUrl}/music/${track.slug}`}
        size={20}
      />

      {/* More options */}
      <div className="bg-muted hover:bg-muted/80 flex h-11 w-11 items-center justify-center rounded-full transition-colors">
        <MusicActionMenu track={musicCardData} size={20} className="text-foreground" />
      </div>
    </div>
  );
}
