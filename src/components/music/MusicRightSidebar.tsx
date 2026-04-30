"use client";

import Link from "next/link";
import Image from "next/image";
import { Download, Flame, Music, Play, Pause, TrendingUp, Loader2, Lock } from "lucide-react";
import { usePlayerStore } from "@/store/player.store";
import { cn } from "@/lib/utils";
import { HeartButton } from "./HeartButton";
import { useSubscription } from "@/hooks/useSubscription";
import { notify } from "@/hooks/useToast";
import {
  getOptimisticPlaybackLockMessage,
  isOptimisticallyStreamLocked,
} from "@/lib/music-access-client";
import type { MusicCardData } from "@/lib/api/music";
import type { Track } from "@/store/player.store";

function toPlayerTrack(t: MusicCardData): Track {
  return {
    id: t.id,
    title: t.title,
    artist: t.artistName,
    artistSlug: t.artistSlug,
    coverArt: t.coverArt ?? null,
    r2Key: t.r2Key,
    duration: 0,
    slug: t.slug,
    isExclusive: t.isExclusive,
    price: t.price,
    accessModel: t.accessModel,
    streamAccess: t.streamAccess,
    creatorPrice: t.creatorPrice,
  };
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

function TrackListItem({
  track,
  index,
  allTracks,
  showDownloads,
}: {
  track: MusicCardData;
  index: number;
  allTracks: MusicCardData[];
  showDownloads?: boolean;
}) {
  const {
    currentTrack,
    isPlaying,
    isBuffering: storeBuffering,
    setTrack,
    setContextQueue,
    togglePlay,
  } = usePlayerStore();
  const { data: subscription } = useSubscription();

  const isCurrentTrack = currentTrack?.id === track.id;
  const isActivelyPlaying = isCurrentTrack && isPlaying;
  const isLoading = isCurrentTrack && storeBuffering;
  const streamLocked = isOptimisticallyStreamLocked(track, subscription?.hasSubscription ?? false);

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isCurrentTrack) {
      togglePlay();
      return;
    }

    if (streamLocked) {
      notify.error(getOptimisticPlaybackLockMessage(track));
      return;
    }

    setContextQueue(allTracks.map(toPlayerTrack), showDownloads ? "Hot Downloads" : "Trending");
    setTrack(toPlayerTrack(track));
  };

  return (
    <div
      className={cn(
        "group hover:bg-muted/50 flex items-center gap-3 px-4 py-2.5 transition-colors",
        isCurrentTrack && "bg-brand/5"
      )}
    >
      {/* Rank / Equalizer / Play button */}
      <div className="relative w-5 flex-shrink-0 text-center">
        {isActivelyPlaying ? (
          <EqualizerBarsMini />
        ) : (
          <>
            <span className="text-muted-foreground/60 block text-xs font-black group-hover:hidden">
              {index + 1}
            </span>
            <button
              type="button"
              onClick={handlePlay}
              className="hidden group-hover:block"
              aria-label={`Play ${track.title}`}
            >
              {isLoading ? (
                <Loader2 className="text-brand h-3.5 w-3.5 animate-spin" />
              ) : isActivelyPlaying ? (
                <Pause className="text-brand h-3.5 w-3.5" />
              ) : streamLocked ? (
                <Lock className="h-3.5 w-3.5 text-amber-500" />
              ) : (
                <Play className="text-foreground h-3.5 w-3.5 fill-current" />
              )}
            </button>
          </>
        )}
      </div>

      {/* Album art */}
      <Link
        href={`/music/${track.slug}`}
        className="bg-muted relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg"
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
          <div className="from-brand/20 to-muted flex h-full w-full items-center justify-center bg-gradient-to-br">
            <Music className="text-muted-foreground h-4 w-4" />
          </div>
        )}
      </Link>

      {/* Track info */}
      <div className="min-w-0 flex-1">
        <Link href={`/music/${track.slug}`}>
          <p
            className={cn(
              "truncate text-[13px] font-semibold transition-colors hover:underline",
              isCurrentTrack ? "text-brand" : "text-foreground"
            )}
          >
            {track.title}
          </p>
        </Link>
        <Link
          href={`/artists/${track.artistSlug}`}
          className="text-muted-foreground hover:text-brand truncate text-[11px] transition-colors"
        >
          {track.artistName}
        </Link>
      </div>

      {/* Heart button — visible on hover */}
      <div className="flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
        <HeartButton musicId={track.id} size={14} />
      </div>

      {/* Badge */}
      {showDownloads && track.downloadCount > 0 && (
        <div className="bg-muted text-muted-foreground flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold">
          <Download className="h-3 w-3" />
          {track.downloadCount.toLocaleString()}
        </div>
      )}
    </div>
  );
}

interface MusicRightSidebarProps {
  trending: MusicCardData[];
  popular: MusicCardData[];
}

export function MusicRightSidebar({ trending, popular }: MusicRightSidebarProps) {
  // Use top 8 from each
  const trendingSlice = trending.slice(0, 8);
  const popularSlice = popular.slice(0, 8);

  return (
    <aside className="scrollbar-auto-hide sticky top-16 hidden h-[calc(100vh-4rem)] space-y-5 overflow-y-auto pb-8 lg:block">
      {/* Trending songs */}
      {trendingSlice.length > 0 && (
        <div className="bg-card/50 ring-border/40 overflow-hidden rounded-2xl ring-1 backdrop-blur-sm">
          <div className="border-border/50 flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
              </div>
              <h3 className="text-foreground text-sm font-bold">Trending</h3>
            </div>
            <Link
              href="/music?sort=popular"
              className="bg-muted text-muted-foreground hover:bg-brand/10 hover:text-brand rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors"
            >
              See all
            </Link>
          </div>
          <div className="divide-border/30 divide-y">
            {trendingSlice.map((track, idx) => (
              <TrackListItem key={track.id} track={track} index={idx} allTracks={trendingSlice} />
            ))}
          </div>
        </div>
      )}

      {/* Hot Downloads */}
      {popularSlice.length > 0 && (
        <div className="bg-card/50 ring-border/40 overflow-hidden rounded-2xl ring-1 backdrop-blur-sm">
          <div className="border-border/50 flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="bg-brand/10 flex h-7 w-7 items-center justify-center rounded-lg">
                <TrendingUp className="text-brand h-3.5 w-3.5" />
              </div>
              <h3 className="text-foreground text-sm font-bold">Hot Downloads</h3>
            </div>
            <Link
              href="/music?sort=downloads"
              className="bg-muted text-muted-foreground hover:bg-brand/10 hover:text-brand rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors"
            >
              See all
            </Link>
          </div>
          <div className="divide-border/30 divide-y">
            {popularSlice.map((track, idx) => (
              <TrackListItem
                key={track.id}
                track={track}
                index={idx}
                allTracks={popularSlice}
                showDownloads
              />
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
