"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Play,
  Download,
  Heart,
  MoreHorizontal,
  ListPlus,
  Share2,
  User,
  Lock,
  Crown,
  ShoppingCart,
} from "lucide-react";
import { motion } from "motion/react";
import useMeasure from "react-use-measure";
import { usePlayerStore } from "@/store/player.store";
import type { Track } from "@/store/player.store";
import { useMusicFavorite } from "@/hooks/useMusicFavorite";
import { useMusicAccess } from "@/hooks/useMusicAccess";
import { useSubscription } from "@/hooks/useSubscription";
import { ShareButton } from "./ShareButton";
import { PaystackButton } from "@/components/payments/PaystackButton";
import { notify } from "@/hooks/useToast";
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
    accessModel: string; // "free" | "subscription" | "purchase" | "both"
    streamAccess: string; // "free" | "subscription"
    creatorPrice: number | null;
    artistName: string;
    artistSlug: string;
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
  const { data: subscription } = useSubscription();
  const { data: streamAccessStatus } = useMusicAccess(track.id, "stream");
  const { data: downloadAccessStatus } = useMusicAccess(track.id, "download");
  const [activeAction, setActiveAction] = useState<string>("play");
  const [downloadState, setDownloadState] = useState<"idle" | "loading" | "done">("idle");

  const isCurrentTrack = currentTrack?.id === track.id;
  const isActivelyPlaying = isCurrentTrack && isPlaying;

  const hasSubscription = subscription?.hasSubscription ?? false;
  const isPurchaseGated = track.accessModel === "purchase" || track.accessModel === "both";
  const isDownloadSubGated =
    track.isExclusive || track.accessModel === "subscription" || track.accessModel === "both";
  const subscriptionCanUnlockStream =
    track.isExclusive ||
    track.streamAccess === "subscription" ||
    track.accessModel === "subscription" ||
    track.accessModel === "both";
  const purchaseCanUnlockStream = isPurchaseGated;
  const isStreamGated =
    subscriptionCanUnlockStream || purchaseCanUnlockStream || track.streamAccess === "subscription";
  const streamAllowed = streamAccessStatus?.allowed ?? !(isStreamGated && !hasSubscription);
  const streamLocked = !streamAllowed;
  const streamRequiresAuth = streamAccessStatus?.requiresAuth ?? false;
  const streamRequiresSubscription =
    streamAccessStatus?.requiresSubscription ?? (subscriptionCanUnlockStream && !hasSubscription);
  const streamRequiresPurchase =
    streamAccessStatus?.requiresPurchase ?? (purchaseCanUnlockStream && !hasSubscription);
  const streamPrice = streamAccessStatus?.price ?? track.creatorPrice ?? track.price;
  const downloadAllowed =
    downloadAccessStatus?.allowed ?? !((isPurchaseGated || isDownloadSubGated) && !hasSubscription);
  const downloadRequiresPurchase =
    downloadAccessStatus?.requiresPurchase ?? (isPurchaseGated && !hasSubscription);
  const downloadLocked = !downloadAllowed;

  const handlePlay = () => {
    setActiveAction("play");
    if (streamLocked) {
      if (streamRequiresSubscription && !streamRequiresPurchase && !streamRequiresAuth) {
        window.location.href = "/billing";
        return;
      }
      notify.error(
        streamRequiresPurchase
          ? "Buy this track to play it."
          : streamRequiresAuth
            ? "Sign in to play this track."
            : "This track is locked."
      );
      return;
    }
    if (isCurrentTrack) {
      togglePlay();
      return;
    }
    const playerTrack: Track = {
      id: track.id,
      title: track.title,
      artist: track.artistName,
      artistSlug: track.artistSlug,
      coverArt: track.coverArt,
      r2Key: track.r2Key,
      duration: track.duration ?? undefined,
      slug: track.slug,
      isExclusive: track.isExclusive,
      price: track.price,
      accessModel: track.accessModel,
      streamAccess: track.streamAccess,
      creatorPrice: track.creatorPrice,
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
        const data = (await res.json().catch(() => null)) as {
          error?: string;
          requiresSubscription?: boolean;
          requiresPurchase?: boolean;
          quotaExceeded?: boolean;
        } | null;
        setDownloadState("idle");
        if (data?.requiresSubscription && !data.requiresPurchase) {
          window.location.href = "/billing";
          return;
        }
        notify.error(data?.error ?? "Download unavailable.");
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

  const playLabel = isActivelyPlaying
    ? "Playing"
    : isCurrentTrack
      ? "Resume"
      : streamLocked
        ? streamRequiresPurchase
          ? "Buy to Play"
          : streamRequiresAuth
            ? "Sign in to Play"
            : "Subscribe to Play"
        : "Play";
  const downloadLabel =
    downloadState === "loading" ? "Getting..." : downloadState === "done" ? "Done!" : "Download";
  const favoriteLabel = isFavorited ? "Saved" : "Save";

  // Stream-locked: show the best matching CTA above action bar
  if (streamLocked) {
    const lockedTitle =
      streamRequiresPurchase && streamRequiresSubscription
        ? "Premium Track"
        : streamRequiresPurchase
          ? "Buy to Play"
          : "Subscribers Only";
    const lockedCopy =
      streamRequiresPurchase && streamRequiresSubscription
        ? "Buy this track or subscribe to unlock streaming and downloads"
        : streamRequiresPurchase
          ? "Buy this track to stream and download it"
          : "Subscribe to stream and download this track";

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
          {streamRequiresPurchase ? (
            <ShoppingCart className="h-5 w-5 shrink-0 text-amber-500" />
          ) : (
            <Crown className="h-5 w-5 shrink-0 text-amber-500" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-foreground text-sm font-semibold">{lockedTitle}</p>
            <p className="text-muted-foreground text-xs">{lockedCopy}</p>
          </div>
          {streamRequiresAuth ? (
            <Link
              href={`/login?callbackUrl=/music/${track.slug}`}
              className="shrink-0 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-amber-400"
            >
              Sign in
            </Link>
          ) : streamRequiresPurchase ? (
            <PaystackButton
              type="download"
              musicId={track.id}
              price={streamPrice}
              label="Buy Track"
              className="h-8 shrink-0 rounded-full px-3 text-xs font-bold"
            />
          ) : (
            <Link
              href="/billing"
              className="shrink-0 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-amber-400"
            >
              Subscribe
            </Link>
          )}
          {!streamRequiresAuth && streamRequiresPurchase && streamRequiresSubscription && (
            <Link
              href="/billing"
              className="text-foreground hover:text-brand hidden shrink-0 text-xs font-bold transition-colors sm:inline"
            >
              Subscribe
            </Link>
          )}
        </div>
        <div className="pointer-events-none flex flex-wrap items-center gap-2 opacity-50">
          <DiscreteAction
            id="play"
            label="Subscribers Only"
            isActive
            onClick={() => {}}
            activeClassName="bg-amber-500 text-white"
          >
            <Lock className="h-[18px] w-[18px]" />
          </DiscreteAction>
        </div>
      </div>
    );
  }

  // Purchase-gated download: show buy CTA inline
  const showBuyCTA = downloadRequiresPurchase && enableDownloads && track.enableDownload;

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

      {/* Download / Buy CTA */}
      {showBuyCTA ? (
        <PaystackButton
          type="download"
          musicId={track.id}
          price={track.creatorPrice ?? track.price}
          className="h-9 rounded-full text-xs font-semibold"
        />
      ) : (
        enableDownloads &&
        track.enableDownload &&
        !downloadLocked && (
          <DiscreteAction
            id="download"
            label={downloadLabel}
            icon={Download}
            isActive={activeAction === "download"}
            onClick={handleDownload}
            activeClassName="bg-brand text-brand-foreground"
          />
        )
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

      {/* Share — styled as discrete pill */}
      <ShareButton
        title={track.title}
        artist={track.artistName}
        url={`${siteUrl}/music/${track.slug}`}
        size={18}
        className="outline-background shadow-md outline outline-2"
      />

      {/* More options — inline smooth-dropdown */}
      <MoreOptionsDropdown track={track} siteUrl={siteUrl} />
    </div>
  );
}

/* ─── Inline Smooth Dropdown for More Options ─── */

const easeOutQuint: [number, number, number, number] = [0.23, 1, 0.32, 1];

const moreMenuItems = [
  { id: "queue", label: "Add to Queue", icon: ListPlus },
  { id: "artist", label: "Go to Artist", icon: User },
  { id: "share", label: "Share", icon: Share2 },
  { id: "download", label: "Download", icon: Download },
];

function MoreOptionsDropdown({
  track,
  siteUrl,
}: {
  track: TrackActionBarProps["track"];
  siteUrl: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [contentRef, contentBounds] = useMeasure();
  const addToQueue = usePlayerStore((s) => s.addToQueue);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const handleAction = useCallback(
    (id: string) => {
      switch (id) {
        case "queue":
          addToQueue({
            id: track.id,
            title: track.title,
            artist: track.artistName,
            coverArt: track.coverArt,
            r2Key: track.r2Key,
            duration: track.duration ?? 0,
            slug: track.slug,
          });
          notify.success(`Added "${track.title}" to queue`);
          break;
        case "artist":
          window.location.href = `/artists?q=${encodeURIComponent(track.artistName)}`;
          break;
        case "share":
          if (navigator.share) {
            navigator
              .share({ title: track.title, url: `${siteUrl}/music/${track.slug}` })
              .catch((err) => {
                if (err instanceof DOMException && err.name === "AbortError") return;
              });
          } else {
            navigator.clipboard
              .writeText(`${siteUrl}/music/${track.slug}`)
              .then(() => notify.success("Link copied!"))
              .catch(() => notify.error("Failed to copy link"));
          }
          break;
        case "download":
          if (track.enableDownload) {
            window.location.href = `/music/${track.slug}?download=true`;
          } else {
            notify.error("Download not available");
          }
          break;
      }
      setIsOpen(false);
    },
    [track, siteUrl, addToQueue]
  );

  const visibleItems = moreMenuItems.filter(
    (item) => item.id !== "download" || track.enableDownload
  );

  const openHeight = Math.max(40, Math.ceil(contentBounds.height));

  return (
    <div ref={containerRef} className="relative h-[38px] w-[38px]">
      <motion.div
        layout
        initial={false}
        animate={{
          width: isOpen ? 200 : 38,
          height: isOpen ? openHeight : 38,
          borderRadius: isOpen ? 14 : 19,
        }}
        transition={{
          type: "spring" as const,
          damping: 34,
          stiffness: 380,
          mass: 0.8,
        }}
        className="bg-muted border-border absolute right-0 bottom-0 origin-bottom-right cursor-pointer overflow-hidden border shadow-lg"
        onClick={() => !isOpen && setIsOpen(true)}
      >
        {/* Trigger icon — visible when closed */}
        <motion.div
          initial={false}
          animate={{
            opacity: isOpen ? 0 : 1,
            scale: isOpen ? 0.8 : 1,
          }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 flex items-center justify-center"
          style={{ pointerEvents: isOpen ? "none" : "auto", willChange: "transform" }}
        >
          <MoreHorizontal className="text-foreground h-[18px] w-[18px]" />
        </motion.div>

        {/* Menu content — fades in when open */}
        <div ref={contentRef}>
          <motion.div
            layout
            initial={false}
            animate={{ opacity: isOpen ? 1 : 0 }}
            transition={{ duration: 0.2, delay: isOpen ? 0.08 : 0 }}
            className="p-1.5"
            style={{ pointerEvents: isOpen ? "auto" : "none", willChange: "transform" }}
          >
            <div className="flex flex-col gap-0.5">
              {visibleItems.map((item, index) => {
                const Icon = item.icon;
                const isHovered = hoveredItem === item.id;
                const itemDelay = isOpen ? 0.06 + index * 0.02 : 0;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{
                      opacity: isOpen ? 1 : 0,
                      x: isOpen ? 0 : 8,
                    }}
                    transition={{ delay: itemDelay, duration: 0.15, ease: easeOutQuint }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction(item.id);
                    }}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className="text-muted-foreground hover:text-foreground relative flex cursor-pointer items-center gap-3 rounded-lg py-2 pr-3 pl-3 text-sm transition-colors duration-200 ease-out"
                  >
                    {isHovered && (
                      <motion.div
                        layoutId="more-menu-bg"
                        className="bg-background/60 absolute inset-0 rounded-lg"
                        transition={{ type: "spring", damping: 30, stiffness: 520, mass: 0.8 }}
                      />
                    )}
                    {isHovered && (
                      <motion.div
                        layoutId="more-menu-bar"
                        className="bg-foreground absolute top-0 bottom-0 left-0 my-auto h-5 w-[3px] rounded-full"
                        transition={{ type: "spring", damping: 30, stiffness: 520, mass: 0.8 }}
                      />
                    )}
                    <Icon size={16} className="relative z-10" />
                    <span className="relative z-10 font-medium whitespace-nowrap">
                      {item.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
