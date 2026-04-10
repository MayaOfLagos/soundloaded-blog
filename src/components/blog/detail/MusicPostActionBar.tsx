"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Play, Download, Heart, Share2, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useMusicFavorite } from "@/hooks/useMusicFavorite";
import { notify } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

interface MusicPostActionBarProps {
  track: {
    id: string;
    title: string;
    slug: string;
    enableDownload: boolean;
    isExclusive: boolean;
    price: number | null;
    artistName: string;
  };
  siteUrl: string;
  enableDownloads: boolean;
}

/* ─── Spring transition matching TrackActionBar / discrete-tabs ─── */

const springTransition = {
  type: "spring" as const,
  damping: 20,
  stiffness: 230,
  mass: 1.2,
};

/* ─── DiscreteAction — pill button with expand/collapse animation ─── */

function DiscreteAction({
  id,
  label,
  icon: Icon,
  isActive,
  onClick,
  activeClassName,
  children,
}: {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick: () => void;
  activeClassName?: string;
  children?: React.ReactNode;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const shineTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [showShine, setShowShine] = useState(false);

  const triggerShine = () => {
    if (shineTimerRef.current) clearTimeout(shineTimerRef.current);
    setShowShine(true);
    shineTimerRef.current = setTimeout(() => setShowShine(false), 800);
  };

  return (
    <motion.div
      layoutId={`post-action-${id}`}
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
            : "bg-muted text-foreground hover:bg-muted/80"
        )}
        aria-label={label}
      >
        {/* Shine sweep */}
        <AnimatePresence>
          {showShine && (
            <motion.span
              className="absolute inset-0 bg-white/15"
              initial={{ x: "-120%" }}
              animate={{ x: "120%" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "linear" }}
            />
          )}
        </AnimatePresence>

        {/* Icon */}
        <motion.span
          layoutId={`post-action-icon-${id}`}
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

/* ─── MusicPostActionBar ─── */

export function MusicPostActionBar({ track, siteUrl, enableDownloads }: MusicPostActionBarProps) {
  const router = useRouter();
  const { isFavorited, toggleFavorite } = useMusicFavorite(track.id);
  const [activeAction, setActiveAction] = useState<string>("play");
  const [downloadState, setDownloadState] = useState<"idle" | "loading" | "done">("idle");

  /* ── Play → navigate to the dedicated /music page ── */
  const handlePlay = () => {
    setActiveAction("play");
    router.push(`/music/${track.slug}`);
  };

  /* ── Download ── */
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

  /* ── Favorite ── */
  const handleFavorite = () => {
    setActiveAction("favorite");
    toggleFavorite();
  };

  /* ── Share ── */
  const handleShare = () => {
    setActiveAction("share");
    const shareUrl = `${siteUrl}/music/${track.slug}`;
    if (navigator.share) {
      navigator
        .share({ title: `${track.title} — ${track.artistName}`, url: shareUrl })
        .catch((err) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
        });
    } else {
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => notify.success("Link copied!"))
        .catch(() => notify.error("Failed to copy link"));
    }
  };

  const downloadLabel =
    downloadState === "loading" ? "Getting..." : downloadState === "done" ? "Done!" : "Download";
  const favoriteLabel = isFavorited ? "Saved" : "Save";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Play → go to music detail page */}
      <DiscreteAction
        id="play"
        label="Listen Now"
        isActive={activeAction === "play"}
        onClick={handlePlay}
        activeClassName="bg-brand text-brand-foreground"
      >
        <Play className="h-[18px] w-[18px] fill-current" />
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

      {/* Share */}
      <DiscreteAction
        id="share"
        label="Share"
        icon={Share2}
        isActive={activeAction === "share"}
        onClick={handleShare}
        activeClassName="bg-brand text-brand-foreground"
      />

      {/* View full page link */}
      <DiscreteAction
        id="view"
        label="Full Page"
        icon={ExternalLink}
        isActive={activeAction === "view"}
        onClick={() => {
          setActiveAction("view");
          router.push(`/music/${track.slug}`);
        }}
        activeClassName="bg-brand text-brand-foreground"
      />
    </div>
  );
}
