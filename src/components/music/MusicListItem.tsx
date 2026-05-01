"use client";

import Link from "next/link";
import Image from "next/image";
import { Play, Music, Headphones, Lock } from "lucide-react";
import { usePlayerStore } from "@/store/player.store";
import { cn } from "@/lib/utils";
import { HeartButton } from "./HeartButton";
import { useSubscription } from "@/hooks/useSubscription";
import { notify } from "@/hooks/useToast";
import { AccessGateBadge } from "@/components/payments/AccessGateBadge";
import {
  getOptimisticPlaybackLockMessage,
  isOptimisticallyStreamLocked,
} from "@/lib/music-access-client";
import type { MusicCardData } from "@/lib/api/music";
import type { Track } from "@/store/player.store";

interface MusicListItemProps {
  track: MusicCardData;
  rank: number;
  listTracks?: MusicCardData[];
  listLabel?: string;
}

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

function EqualizerBars() {
  return (
    <div className="flex h-3 items-end gap-[2px]">
      <span className="bg-brand w-[2.5px] animate-[soundloaded-equalizer_0.4s_ease_infinite] rounded-full" />
      <span className="bg-brand w-[2.5px] animate-[soundloaded-equalizer_0.6s_ease_infinite_0.1s] rounded-full" />
      <span className="bg-brand w-[2.5px] animate-[soundloaded-equalizer_0.5s_ease_infinite_0.2s] rounded-full" />
    </div>
  );
}

export function MusicListItem({ track, rank, listTracks, listLabel }: MusicListItemProps) {
  const { currentTrack, isPlaying, setTrack, setContextQueue, togglePlay } = usePlayerStore();
  const { data: subscription } = useSubscription();

  const isCurrentTrack = currentTrack?.id === track.id;
  const isActivelyPlaying = isCurrentTrack && isPlaying;

  const streamLocked = isOptimisticallyStreamLocked(track, subscription?.hasSubscription ?? false);

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (streamLocked) {
      notify.error(getOptimisticPlaybackLockMessage(track));
      return;
    }

    if (isCurrentTrack) {
      togglePlay();
      return;
    }

    if (listTracks?.length) {
      setContextQueue(listTracks.map(toPlayerTrack), listLabel || "");
    }
    setTrack(toPlayerTrack(track));
  };

  return (
    <div
      className={cn(
        "group/item hover:bg-muted/50 flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors",
        isCurrentTrack && "bg-muted/30"
      )}
    >
      {/* Rank number / play button */}
      <button
        type="button"
        onClick={handlePlay}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center"
        aria-label={isActivelyPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
      >
        {isActivelyPlaying ? (
          <EqualizerBars />
        ) : (
          <>
            <span className="text-muted-foreground block text-base font-bold tabular-nums group-hover/item:hidden">
              {streamLocked ? <Lock className="h-4 w-4 text-amber-500" /> : rank}
            </span>
            <Play
              className="text-foreground hidden h-4 w-4 group-hover/item:block"
              fill="currentColor"
              strokeWidth={0}
            />
          </>
        )}
      </button>

      {/* Cover art */}
      <Link
        href={`/music/${track.slug}`}
        className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded"
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
          <div className="from-brand/10 to-muted flex h-full w-full items-center justify-center bg-gradient-to-br">
            <Music className="text-muted-foreground/40 h-4 w-4" />
          </div>
        )}
      </Link>

      {/* Title + artist */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Link
            href={`/music/${track.slug}`}
            className={cn(
              "block truncate text-sm font-semibold transition-colors hover:underline",
              isCurrentTrack ? "text-brand" : "text-foreground"
            )}
          >
            {track.title}
          </Link>
          {(track.accessModel !== "free" || track.streamAccess === "subscription") && (
            <AccessGateBadge
              accessModel={track.accessModel}
              streamAccess={track.streamAccess}
              creatorPrice={track.creatorPrice}
              size="xs"
              className="flex-shrink-0"
            />
          )}
        </div>
        <Link
          href={`/artists/${track.artistSlug}`}
          className="text-muted-foreground hover:text-brand truncate text-xs transition-colors"
        >
          {track.artistName}
        </Link>
      </div>

      {/* Stream count */}
      <div className="text-muted-foreground hidden items-center gap-1 text-xs tabular-nums sm:flex">
        <Headphones className="h-3 w-3" />
        <span>{track.streamCount.toLocaleString()}</span>
      </div>

      {/* Heart button */}
      <HeartButton
        musicId={track.id}
        size={16}
        className="flex-shrink-0 opacity-0 transition-opacity group-hover/item:opacity-100"
        source={{
          surface: "EXPLORE_TOP",
          placement: "music_list_item_heart",
          position: rank - 1,
          candidateSource: listLabel ?? "music_list",
        }}
      />
    </div>
  );
}
