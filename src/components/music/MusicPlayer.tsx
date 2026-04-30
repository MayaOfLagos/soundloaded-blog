"use client";

import { useEffect, useRef, useState } from "react";
import { Howl } from "howler";
import Image from "next/image";
import Link from "next/link";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ChevronDown,
  X,
  Music,
  Shuffle,
  Repeat,
  Repeat1,
  Loader2,
  ListOrdered,
} from "lucide-react";
import { usePlayerStore } from "@/store/player.store";
import { HeartButton } from "./HeartButton";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useSettings } from "@/hooks/useSettings";
import { notify } from "@/hooks/useToast";
import { Slider } from "@/components/ui/slider";
import { formatDuration } from "@/lib/utils";
import { MiniPlayer } from "./MiniPlayer";
import { NowPlayingDrawer } from "./NowPlayingDrawer";
import { MobileExpandedPlayer } from "./MobileExpandedPlayer";
import { QueueSheet } from "./QueueSheet";

interface MusicAccessResponse {
  allowed: boolean;
  reason: string;
  error: string | null;
  requiresAuth: boolean;
  requiresSubscription: boolean;
  requiresPurchase: boolean;
}

function createBrowserId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `sl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

function getStoredBrowserId(storage: Storage | undefined, key: string) {
  if (!storage) return null;

  try {
    const existing = storage.getItem(key);
    if (existing) return existing;

    const next = createBrowserId();
    storage.setItem(key, next);
    return next;
  } catch {
    return null;
  }
}

function getLockedPlaybackMessage(access: MusicAccessResponse) {
  if (access.requiresPurchase && access.requiresSubscription) {
    return "Buy this track or subscribe to play it.";
  }

  if (access.requiresPurchase) {
    return "Buy this track to play it.";
  }

  if (access.requiresSubscription) {
    return "Subscribe to play this track.";
  }

  if (access.requiresAuth) {
    return "Sign in to play this track.";
  }

  return access.error ?? "This track is locked.";
}

export function MusicPlayer() {
  // Rehydrate persisted store AFTER React hydration to avoid SSR mismatch
  useEffect(() => {
    usePlayerStore.persist.rehydrate();
  }, []);

  const {
    currentTrack,
    isPlaying,
    isBuffering,
    volume,
    isMuted,
    currentTime,
    duration,
    isMinimized,
    shuffle,
    repeatMode,
    isQueueOpen,
    userQueue,
    contextQueue,
    setCurrentTime,
    setDuration,
    setBuffering,
    togglePlay,
    playNext,
    playPrev,
    setVolume,
    toggleMute,
    toggleMinimize,
    toggleShuffle,
    cycleRepeat,
    toggleQueueOpen,
    clearPlayer,
  } = usePlayerStore();

  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { data: settings } = useSettings();
  const drawerEnabled = settings?.enableNowPlayingDrawer !== false;
  const howlRef = useRef<Howl | null>(null);
  const animFrameRef = useRef<number>(0);
  const playCountedRef = useRef<string | null>(null);
  const listenedSecondsRef = useRef(0);
  const lastTickTimeRef = useRef(0);
  const seekBarRef = useRef<HTMLDivElement>(null);
  // Gate: prevents the [isPlaying] effect from conflicting with the
  // [currentTrack?.id] effect during track changes (avoids double-play).
  const playableRef = useRef(false);
  const [, setSeeking] = useState(false);
  const [hoverTime, setHoverTime] = useState<{ time: number; x: number } | null>(null);

  useEffect(() => {
    if (!currentTrack) return;
    let cancelled = false;
    // Prevent the [isPlaying] effect from touching the Howl during track init
    playableRef.current = false;

    if (howlRef.current) {
      howlRef.current.stop();
      howlRef.current.unload();
    }
    playCountedRef.current = null;
    listenedSecondsRef.current = 0;
    lastTickTimeRef.current = 0;

    // Skip tracks without an audio file
    if (!currentTrack.r2Key) {
      setBuffering(false);
      usePlayerStore.getState().setPlaying(false);
      return;
    }

    const initialiseTrack = async () => {
      try {
        const res = await fetch(`/api/music/${currentTrack.id}/access?intent=stream`, {
          cache: "no-store",
        });
        const access = (await res.json().catch(() => null)) as MusicAccessResponse | null;

        if (cancelled) return;

        if (access && !access.allowed) {
          cancelAnimationFrame(animFrameRef.current);
          setBuffering(false);
          usePlayerStore.getState().setPlaying(false);
          notify.error(getLockedPlaybackMessage(access));
          return;
        }
      } catch {
        // Let the stream route remain the final authority if the preflight fails.
      }

      if (cancelled) return;

      // Save the current position before creating a new Howl
      // On page restore, currentTime has the persisted value from localStorage
      const seekTo = currentTime > 0 ? currentTime : 0;

      const streamUrl = `/api/music/${currentTrack.id}/stream`;
      howlRef.current = new Howl({
        src: [streamUrl],
        html5: true,
        volume: isMuted ? 0 : volume,
        onload: () => {
          setDuration(howlRef.current?.duration() ?? 0);
          // Seek to saved position (from page restore or track resume)
          if (seekTo > 0 && howlRef.current) {
            howlRef.current.seek(seekTo);
          }
        },
        onplay: () => {
          setBuffering(false);
          usePlayerStore.getState().setPlaying(true);
          // Now the [isPlaying] effect can manage play/pause for this Howl
          playableRef.current = true;
          lastTickTimeRef.current = Date.now();
          const tick = () => {
            if (howlRef.current?.playing()) {
              setCurrentTime(howlRef.current.seek() as number);
              // Track actual listen time (real elapsed time, not seek position)
              const now = Date.now();
              const elapsed = (now - lastTickTimeRef.current) / 1000;
              lastTickTimeRef.current = now;
              // Only count small increments (< 2s) to ignore seek jumps
              if (elapsed < 2) {
                listenedSecondsRef.current += elapsed;
              }
              // Count qualified play after 30s, or 50% for short tracks.
              const trackId = usePlayerStore.getState().currentTrack?.id;
              const currentDuration = howlRef.current?.duration() || duration || 0;
              const qualifiedPlaySeconds =
                currentDuration > 0 ? Math.max(5, Math.min(30, currentDuration * 0.5)) : 30;
              if (
                trackId &&
                listenedSecondsRef.current >= qualifiedPlaySeconds &&
                playCountedRef.current !== trackId
              ) {
                playCountedRef.current = trackId;
                fetch(`/api/music/${trackId}/play-count`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    surface: "MUSIC_DETAIL",
                    anonymousId: getStoredBrowserId(window.localStorage, "sl_anonymous_id"),
                    sessionId: getStoredBrowserId(window.sessionStorage, "sl_session_id"),
                    listenedSeconds: Math.round(listenedSecondsRef.current),
                    duration: Math.round(currentDuration),
                  }),
                }).catch(() => {});
              }
              animFrameRef.current = requestAnimationFrame(tick);
            }
          };
          animFrameRef.current = requestAnimationFrame(tick);
        },
        onend: () => {
          cancelAnimationFrame(animFrameRef.current);
          const { repeatMode } = usePlayerStore.getState();
          if (repeatMode === "one" && howlRef.current) {
            howlRef.current.seek(0);
            howlRef.current.play();
          } else {
            playNext();
          }
        },
        onloaderror: () => {
          cancelAnimationFrame(animFrameRef.current);
          setBuffering(false);
          usePlayerStore.getState().setPlaying(false);
        },
        onplayerror: () => {
          cancelAnimationFrame(animFrameRef.current);
          setBuffering(false);
          usePlayerStore.getState().setPlaying(false);
        },
        onpause: () => cancelAnimationFrame(animFrameRef.current),
        onstop: () => cancelAnimationFrame(animFrameRef.current),
      });
      // Only auto-play if user initiated (isBuffering=true from setTrack)
      // On page restore, isBuffering is false (not persisted) — just load, don't play
      if (isBuffering) {
        howlRef.current.play();
      } else {
        // Page restore: allow the [isPlaying] effect to manage this Howl
        playableRef.current = true;
      }
    };

    initialiseTrack();
    return () => {
      cancelled = true;
      cancelAnimationFrame(animFrameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  useEffect(() => {
    if (!howlRef.current || !playableRef.current) return;
    if (isPlaying) {
      // Only play if not already playing — avoids double-play when the
      // onplay callback sets isPlaying=true while the Howl is already active
      if (!howlRef.current.playing()) {
        howlRef.current.play();
      }
    } else {
      howlRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    howlRef.current?.volume(isMuted ? 0 : volume);
  }, [volume, isMuted]);

  const handleSeek = (val: number[]) => {
    const t = val[0];
    howlRef.current?.seek(t);
    setCurrentTime(t);
  };

  const handleSeekBarHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = seekBarRef.current;
    if (!bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const ratio = x / rect.width;
    setHoverTime({ time: ratio * duration, x });
  };

  if (!currentTrack) return null;

  const desktopCover = (
    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded">
      {currentTrack.coverArt ? (
        <Image src={currentTrack.coverArt} alt={currentTrack.title} fill className="object-cover" />
      ) : (
        <div className="bg-muted flex h-full w-full items-center justify-center">
          <Music className="text-muted-foreground h-5 w-5" />
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* MiniPlayer — shown when minimized */}
      {isMinimized && <MiniPlayer />}

      {/* Mobile: full-screen Now Playing drawer or compact expanded player */}
      {!isDesktop && drawerEnabled && (
        <NowPlayingDrawer
          open={!isMinimized}
          onOpenChange={(open) => {
            if (!open) toggleMinimize();
          }}
          onSeek={handleSeek}
        />
      )}
      {!isDesktop && !drawerEnabled && !isMinimized && <MobileExpandedPlayer onSeek={handleSeek} />}

      {/* Desktop — Spotify-style 3-column grid */}
      {!isMinimized && (
        <div className="border-border bg-card/95 fixed right-0 bottom-0 left-0 z-50 hidden border-t backdrop-blur-md md:block">
          <div className="mx-auto grid h-[72px] grid-cols-[1fr_2fr_1fr] items-center gap-4 px-4">
            {/* Left: cover + info + heart */}
            <div className="flex min-w-0 items-center gap-3">
              {desktopCover}
              <div className="min-w-0">
                <Link
                  href={`/music/${currentTrack.slug}`}
                  className="text-foreground block truncate text-sm font-semibold hover:underline"
                >
                  {currentTrack.title}
                </Link>
                {currentTrack.artistSlug ? (
                  <Link
                    href={`/artists/${currentTrack.artistSlug}`}
                    className="text-muted-foreground hover:text-brand block truncate text-xs transition-colors"
                  >
                    {currentTrack.artist}
                  </Link>
                ) : (
                  <p className="text-muted-foreground truncate text-xs">{currentTrack.artist}</p>
                )}
              </div>
              <HeartButton
                musicId={currentTrack.id}
                size={16}
                className="ml-1 shrink-0 hover:scale-105"
              />
            </div>

            {/* Center: controls + progress */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={toggleShuffle}
                  className={`flex items-center justify-center transition-all hover:scale-105 ${shuffle ? "text-brand" : "text-muted-foreground hover:text-foreground"}`}
                  aria-label={shuffle ? "Disable shuffle" : "Enable shuffle"}
                >
                  <Shuffle className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={playPrev}
                  className="text-muted-foreground hover:text-foreground flex items-center justify-center transition-all hover:scale-105"
                  aria-label="Previous"
                >
                  <SkipBack className="h-5 w-5" fill="currentColor" />
                </button>
                <button
                  type="button"
                  onClick={togglePlay}
                  className="bg-foreground text-background flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95"
                  aria-label={isBuffering ? "Loading" : isPlaying ? "Pause" : "Play"}
                >
                  {isBuffering ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="h-4 w-4" fill="currentColor" strokeWidth={0} />
                  ) : (
                    <Play
                      className="h-4 w-4 translate-x-[1px]"
                      fill="currentColor"
                      strokeWidth={0}
                    />
                  )}
                </button>
                <button
                  type="button"
                  onClick={playNext}
                  className="text-muted-foreground hover:text-foreground flex items-center justify-center transition-all hover:scale-105"
                  aria-label="Next"
                >
                  <SkipForward className="h-5 w-5" fill="currentColor" />
                </button>
                <button
                  type="button"
                  onClick={cycleRepeat}
                  className={`relative flex items-center justify-center transition-all hover:scale-105 ${repeatMode !== "off" ? "text-brand" : "text-muted-foreground hover:text-foreground"}`}
                  aria-label={`Repeat: ${repeatMode}`}
                >
                  {repeatMode === "one" ? (
                    <Repeat1 className="h-4 w-4" />
                  ) : (
                    <Repeat className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="flex w-full max-w-[400px] items-center gap-2">
                <span className="text-muted-foreground w-7 text-right text-[11px] tabular-nums">
                  {formatDuration(currentTime)}
                </span>
                <div
                  ref={seekBarRef}
                  className="relative flex-1"
                  onMouseMove={handleSeekBarHover}
                  onMouseLeave={() => setHoverTime(null)}
                >
                  {hoverTime && (
                    <div
                      className="bg-foreground text-background pointer-events-none absolute -top-8 z-10 rounded px-1.5 py-0.5 text-[11px] font-medium tabular-nums"
                      style={{ left: hoverTime.x, transform: "translateX(-50%)" }}
                    >
                      {formatDuration(hoverTime.time)}
                    </div>
                  )}
                  <Slider
                    min={0}
                    max={duration || 1}
                    step={0.5}
                    value={[currentTime]}
                    onValueChange={handleSeek}
                    onPointerDown={() => setSeeking(true)}
                    onPointerUp={() => setSeeking(false)}
                    className="cursor-pointer"
                    aria-label="Seek"
                  />
                </div>
                <span className="text-muted-foreground w-7 text-[11px] tabular-nums">
                  {formatDuration(duration)}
                </span>
              </div>
            </div>

            {/* Right: volume + minimize + close */}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={toggleMute}
                className="text-muted-foreground hover:text-foreground flex items-center justify-center transition-all hover:scale-105"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
              <Slider
                variant="thin"
                min={0}
                max={1}
                step={0.05}
                value={[isMuted ? 0 : volume]}
                onValueChange={(v) => setVolume(v[0])}
                className="w-20 cursor-pointer"
                aria-label="Volume"
              />
              <button
                type="button"
                onClick={toggleQueueOpen}
                className={`ml-2 flex items-center justify-center transition-all hover:scale-105 ${isQueueOpen ? "text-brand" : "text-muted-foreground hover:text-foreground"}`}
                aria-label="Toggle queue"
              >
                <div className="relative">
                  <ListOrdered className="h-4 w-4" />
                  {userQueue.length + contextQueue.length > 0 && (
                    <span className="bg-brand absolute -top-1.5 -right-1.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full px-0.5 text-[8px] font-bold text-white">
                      {userQueue.length + contextQueue.length}
                    </span>
                  )}
                </div>
              </button>
              <button
                type="button"
                onClick={toggleMinimize}
                className="text-muted-foreground hover:text-foreground ml-2 flex items-center justify-center transition-all hover:scale-105"
                aria-label="Minimize"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={clearPlayer}
                className="text-muted-foreground flex items-center justify-center transition-colors hover:text-red-500"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile queue sheet — desktop queue is in layout */}
      {!isDesktop && <QueueSheet />}
    </>
  );
}
