"use client";

import { useState, useRef } from "react";
import { Play, Download, Heart } from "lucide-react";
import { motion } from "motion/react";
import { usePlayerStore } from "@/store/player.store";
import type { Track } from "@/store/player.store";
import { useMusicFavorite } from "@/hooks/useMusicFavorite";
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

const springTransition = {
  type: "spring" as const,
  damping: 20,
  stiffness: 230,
  mass: 1.2,
};

function EqualizerBars() {
  return (
    <div className="flex h-3.5 items-end gap-[2px]">
      <span className="bg-brand-foreground w-[3px] animate-[soundloaded-equalizer_0.4s_ease_infinite] rounded-full" />
      <span className="bg-brand-foreground w-[3px] animate-[soundloaded-equalizer_0.6s_ease_infinite_0.1s] rounded-full" />
      <span className="bg-brand-foreground w-[3px] animate-[soundloaded-equalizer_0.5s_ease_infinite_0.2s] rounded-full" />
    </div>
  );
}

/** Discrete-tab style pill button with expand/collapse animation */
function DiscreteAction({
  id,
  label,
  icon: Icon,
  isActive,
  onClick,
  className,
  activeClassName,
  children,
}: {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick: () => void;
  className?: string;
  activeClassName?: string;
  children?: React.ReactNode;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const shineTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [showShine, setShowShine] = useState(false);

  // Trigger shine on activation via callback, not effect
  const triggerShine = () => {
    if (shineTimerRef.current) clearTimeout(shineTimerRef.current);
    setShowShine(true);
    shineTimerRef.current = setTimeout(() => setShowShine(false), 800);
  };

  return (
    <motion.div
      layoutId={`track-action-${id}`}
      transition={{ layout: springTransition }}
      style={{ willChange: "transform" }}
      className="flex h-fit w-fit"
    >
      <motion.button
        type="button"
        layout
        transition={{ layout: springTransition }}
        onClick={() => {
          onClick();
          if (!isLoaded) setIsLoaded(true);
          if (isLoaded) triggerShine();
        }}
        className={cn(
          "outline-background relative flex cursor-pointer items-center gap-1.5 overflow-hidden rounded-full p-2.5 text-sm font-semibold shadow-md outline outline-2 transition-colors duration-75 ease-out",
          isActive ? "px-4" : "px-2.5",
          isActive
            ? (activeClassName ?? "bg-brand text-brand-foreground")
            : "bg-muted text-foreground hover:bg-muted/80",
          className
        )}
        aria-label={label}
      >
        {/* Shine effect on activation */}
        {showShine && (
          <motion.span
            className="absolute inset-0 bg-white/15"
            initial={{ x: "-120%" }}
            animate={{ x: "120%" }}
            transition={{ duration: 0.6, ease: "linear" }}
          />
        )}

        {/* Icon */}
        <motion.span
          layoutId={`track-action-icon-${id}`}
          className="relative z-10 shrink-0"
          style={{ willChange: "transform" }}
        >
          {children ?? (Icon && <Icon className="h-[18px] w-[18px]" />)}
        </motion.span>

        {/* Expanding label */}
        {isActive && (
          <motion.span
            className="relative z-10 text-sm font-semibold whitespace-nowrap"
            initial={isLoaded ? { opacity: 0, filter: "blur(4px)" } : false}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{
              duration: isLoaded ? 0.2 : 0,
              ease: [0.86, 0, 0.07, 1],
            }}
          >
            {label}
          </motion.span>
        )}
      </motion.button>
    </motion.div>
  );
}

export function TrackActionBar({ track, siteUrl, enableDownloads }: TrackActionBarProps) {
  const { currentTrack, isPlaying, setTrack, togglePlay } = usePlayerStore();
  const { isFavorited, toggleFavorite } = useMusicFavorite(track.id);
  const [activeAction, setActiveAction] = useState<string>("play");
  const [downloadState, setDownloadState] = useState<"idle" | "loading" | "done">("idle");

  const isCurrentTrack = currentTrack?.id === track.id;
  const isActivelyPlaying = isCurrentTrack && isPlaying;

  const handlePlay = () => {
    setActiveAction("play");
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

  const handleDownload = async () => {
    setActiveAction("download");
    if (downloadState !== "idle") return;

    setDownloadState("loading");
    try {
      const res = await fetch(`/api/music/${track.id}/download`, { method: "POST" });
      if (!res.ok) {
        setDownloadState("idle");
        return;
      }
      const { url, filename } = await res.json();
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDownloadState("done");
      setTimeout(() => setDownloadState("idle"), 3000);
    } catch {
      setDownloadState("idle");
    }
  };

  const handleFavorite = () => {
    setActiveAction("favorite");
    toggleFavorite();
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

  const playLabel = isActivelyPlaying ? "Playing" : isCurrentTrack ? "Resume" : "Play";
  const downloadLabel =
    downloadState === "loading" ? "Getting..." : downloadState === "done" ? "Done!" : "Download";
  const favoriteLabel = isFavorited ? "Saved" : "Save";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Play / Pause */}
      <DiscreteAction
        id="play"
        label={playLabel}
        isActive={activeAction === "play"}
        onClick={handlePlay}
        activeClassName="bg-brand text-brand-foreground"
      >
        {isActivelyPlaying ? (
          <EqualizerBars />
        ) : (
          <Play className="h-[18px] w-[18px] fill-current" />
        )}
      </DiscreteAction>

      {/* Download */}
      {enableDownloads && track.enableDownload && (
        <DiscreteAction
          id="download"
          label={downloadLabel}
          icon={Download}
          isActive={activeAction === "download"}
          onClick={handleDownload}
          activeClassName="bg-brand text-brand-foreground"
        />
      )}

      {/* Favorite / Save */}
      <DiscreteAction
        id="favorite"
        label={favoriteLabel}
        isActive={activeAction === "favorite"}
        onClick={handleFavorite}
        activeClassName={isFavorited ? "bg-red-500 text-white" : "bg-brand text-brand-foreground"}
      >
        <Heart
          className={cn("h-[18px] w-[18px] transition-colors", isFavorited && "fill-current")}
        />
      </DiscreteAction>

      {/* Share — keeps its dropdown behavior, styled as discrete pill */}
      <ShareButton
        title={track.title}
        artist={track.artistName}
        url={`${siteUrl}/music/${track.slug}`}
        size={18}
        className="bg-muted hover:bg-muted/80 outline-background h-[38px] w-[38px] shadow-md outline outline-2"
      />

      {/* More options */}
      <div className="bg-muted hover:bg-muted/80 outline-background flex h-[38px] w-[38px] items-center justify-center rounded-full shadow-md outline outline-2 transition-colors">
        <MusicActionMenu track={musicCardData} size={18} className="text-foreground" />
      </div>
    </div>
  );
}
