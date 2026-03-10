"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Music } from "lucide-react";
import { Howl } from "howler";
import { useMarkStoryViewed } from "@/hooks/useStories";
import type { StoryGroupResponse } from "@/app/api/stories/route";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

interface StoryViewerProps {
  storyGroups: StoryGroupResponse[];
  initialGroupIndex: number;
  onClose: () => void;
}

export function StoryViewer({ storyGroups, initialGroupIndex, onClose }: StoryViewerProps) {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [itemIndex, setItemIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const markViewed = useMarkStoryViewed();
  const howlRef = useRef<Howl | null>(null);

  const currentGroup = storyGroups[groupIndex];
  const currentItem = currentGroup?.stories[itemIndex];
  const totalItems = currentGroup?.stories.length ?? 0;
  const duration = (currentItem?.duration ?? 5) * 1000;

  // Mark as viewed when item changes
  useEffect(() => {
    if (currentItem) {
      markViewed.mutate(currentItem.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentItem?.id]);

  // Audio overlay playback
  useEffect(() => {
    howlRef.current?.unload();
    howlRef.current = null;

    if (!currentItem?.audioUrl) return;

    const startTime = currentItem.audioStartTime ?? 0;
    const endTime = currentItem.audioEndTime ?? 30;

    const howl = new Howl({
      src: [currentItem.audioUrl],
      onload: () => {
        howl.seek(startTime);
        howl.play();
      },
    });
    howlRef.current = howl;

    const stopTimer = setInterval(() => {
      const current = howl.seek() as number;
      if (current >= endTime) {
        howl.seek(startTime);
      }
    }, 200);

    return () => {
      clearInterval(stopTimer);
      howl.unload();
    };
  }, [
    currentItem?.id,
    currentItem?.audioUrl,
    currentItem?.audioStartTime,
    currentItem?.audioEndTime,
  ]);

  // Pause/resume audio with story
  useEffect(() => {
    const howl = howlRef.current;
    if (!howl) return;
    if (paused) {
      howl.pause();
    } else if (!howl.playing()) {
      howl.play();
    }
  }, [paused]);

  // Progress timer
  useEffect(() => {
    if (paused || !currentItem) return;
    setProgress(0);

    const interval = 50; // update every 50ms
    const step = (interval / duration) * 100;
    let current = 0;

    const timer = setInterval(() => {
      current += step;
      if (current >= 100) {
        clearInterval(timer);
        goNext();
      } else {
        setProgress(current);
      }
    }, interval);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupIndex, itemIndex, paused, duration]);

  const goNext = useCallback(() => {
    if (itemIndex < totalItems - 1) {
      setItemIndex((i) => i + 1);
      setProgress(0);
    } else if (groupIndex < storyGroups.length - 1) {
      setGroupIndex((g) => g + 1);
      setItemIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [itemIndex, totalItems, groupIndex, storyGroups.length, onClose]);

  const goPrev = useCallback(() => {
    if (itemIndex > 0) {
      setItemIndex((i) => i - 1);
      setProgress(0);
    } else if (groupIndex > 0) {
      setGroupIndex((g) => g - 1);
      setItemIndex(0);
      setProgress(0);
    }
  }, [itemIndex, groupIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, goNext, goPrev]);

  if (!currentGroup || !currentItem) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      >
        {/* Story content */}
        <div
          className="relative flex h-full w-full max-w-md flex-col"
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => setPaused(false)}
          onPointerLeave={() => setPaused(false)}
        >
          {/* Progress bars */}
          <div className="absolute top-0 right-0 left-0 z-20 flex gap-1 px-3 pt-3">
            {currentGroup.stories.map((_, i) => (
              <div key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
                <div
                  className="h-full rounded-full bg-white transition-[width] duration-75 ease-linear"
                  style={{
                    width: i < itemIndex ? "100%" : i === itemIndex ? `${progress}%` : "0%",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-5 right-0 left-0 z-20 flex items-center gap-3 px-4 pt-2">
            {currentGroup.author.image ? (
              <Image
                src={currentGroup.author.image}
                alt={currentGroup.author.name ?? ""}
                width={32}
                height={32}
                className="rounded-full ring-2 ring-white/30"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                {currentGroup.author.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <div className="flex-1">
              <span className="text-sm font-semibold text-white">
                {currentGroup.author.name ?? "User"}
              </span>
              <span className="ml-2 text-xs text-white/60">{timeAgo(currentItem.createdAt)}</span>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-white transition-colors hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Media */}
          <div className="relative flex flex-1 items-center justify-center">
            {currentItem.type === "TEXT" ? (
              <div
                key={currentItem.id}
                className="flex h-full w-full items-center justify-center p-8"
                style={{
                  background:
                    currentItem.backgroundColor ??
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                }}
              >
                <p className="text-center text-2xl font-bold text-white drop-shadow-lg">
                  {currentItem.textContent}
                </p>
              </div>
            ) : currentItem.type === "VIDEO" ? (
              <video
                key={currentItem.id}
                src={currentItem.mediaUrl}
                className="h-full w-full object-cover object-center"
                autoPlay
                muted
                playsInline
              />
            ) : currentItem.mediaUrl ? (
              <Image
                key={currentItem.id}
                src={currentItem.mediaUrl}
                alt={currentItem.caption ?? "Story"}
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 448px"
                priority
              />
            ) : null}

            {/* Audio indicator */}
            {currentItem.audioUrl && (
              <div className="absolute bottom-16 left-4 z-10 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 backdrop-blur-sm">
                <Music className="h-3 w-3 text-white" />
                <span className="text-[10px] font-medium text-white">Playing</span>
              </div>
            )}

            {/* Caption overlay */}
            {currentItem.caption && (
              <div className="absolute right-0 bottom-0 left-0 z-10 bg-gradient-to-t from-black/80 to-transparent px-4 pt-12 pb-6">
                <p className="text-sm leading-relaxed text-white">{currentItem.caption}</p>
              </div>
            )}
          </div>

          {/* Tap zones */}
          <button
            className="absolute top-0 left-0 z-10 h-full w-1/3"
            onClick={goPrev}
            aria-label="Previous"
          />
          <button
            className="absolute top-0 right-0 z-10 h-full w-2/3"
            onClick={goNext}
            aria-label="Next"
          />
        </div>

        {/* Desktop: prev/next group arrows */}
        {groupIndex > 0 && (
          <button
            onClick={() => {
              setGroupIndex((g) => g - 1);
              setItemIndex(0);
              setProgress(0);
            }}
            className="absolute left-4 hidden rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20 md:block"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {groupIndex < storyGroups.length - 1 && (
          <button
            onClick={() => {
              setGroupIndex((g) => g + 1);
              setItemIndex(0);
              setProgress(0);
            }}
            className="absolute right-4 hidden rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20 md:block"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
