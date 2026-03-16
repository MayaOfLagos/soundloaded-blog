"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Music, Volume2, VolumeX } from "lucide-react";
import { Howl } from "howler";
import { useTimerContext } from "@react-instastories/base";
import { useMediaTimer } from "@react-instastories/external";
import { useMarkStoryViewed } from "@/hooks/useStories";
import type { StoryItemResponse, StoryGroupResponse } from "@/app/api/stories/route";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

interface StoryPageContentProps {
  item: StoryItemResponse;
  author: StoryGroupResponse["author"];
}

function VideoStoryContent({ item }: { item: StoryItemResponse }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const timer = useTimerContext();

  // Sync video playback with the story timer
  // eslint-disable-next-line react-hooks/refs
  useMediaTimer(videoRef.current);

  // Play/pause video when timer starts/pauses
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (timer.active) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [timer.active]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => !prev);
  }, []);

  return (
    <>
      <video
        ref={videoRef}
        src={item.mediaUrl}
        autoPlay
        playsInline
        muted={muted}
        className="story-page-media"
      />
      <button
        type="button"
        onClick={toggleMute}
        className="story-mute-btn"
        aria-label={muted ? "Unmute" : "Mute"}
      >
        {muted ? (
          <VolumeX className="h-4 w-4 text-white" />
        ) : (
          <Volume2 className="h-4 w-4 text-white" />
        )}
      </button>
    </>
  );
}

export function StoryPageContent({ item, author }: StoryPageContentProps) {
  const markViewed = useMarkStoryViewed();
  const howlRef = useRef<Howl | null>(null);
  const timer = useTimerContext();

  // Mark as viewed on mount
  useEffect(() => {
    markViewed.mutate(item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  // Audio overlay playback — sync with timer pause/play
  useEffect(() => {
    howlRef.current?.unload();
    howlRef.current = null;

    if (!item.audioUrl) return;

    const startTime = item.audioStartTime ?? 0;
    const endTime = item.audioEndTime ?? 30;

    const howl = new Howl({
      src: [item.audioUrl],
      onload: () => {
        howl.seek(startTime);
        if (timer.active) howl.play();
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
  }, [item.id, item.audioUrl, item.audioStartTime, item.audioEndTime, timer.active]);

  // Pause/resume audio when timer pauses/resumes
  useEffect(() => {
    const howl = howlRef.current;
    if (!howl) return;

    if (timer.active) {
      if (!howl.playing()) howl.play();
    } else {
      howl.pause();
    }
  }, [timer.active]);

  return (
    <>
      {item.type === "VIDEO" ? (
        <VideoStoryContent item={item} />
      ) : item.type !== "TEXT" && item.mediaUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.mediaUrl} alt={item.caption ?? "Story"} className="story-page-media" />
      ) : null}

      {item.type === "TEXT" && (
        <div
          className="story-page-text-bg"
          style={{
            background: item.backgroundColor ?? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
        >
          <p className="text-center text-2xl font-bold text-white drop-shadow-lg">
            {item.textContent}
          </p>
        </div>
      )}

      <address>
        {author.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={author.image} alt={author.name ?? ""} className="rounded-full" />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
            {author.name?.[0]?.toUpperCase() ?? "?"}
          </span>
        )}
        <span className="font-semibold text-white">{author.name ?? "User"}</span>
        <time className="text-white/60">{timeAgo(item.createdAt)}</time>
      </address>

      <div />

      <div className="story-page-bottom">
        {item.audioUrl && (
          <div className="story-audio-pill">
            <Music className="h-3 w-3 text-white" />
            <span className="text-[10px] font-medium text-white">Playing</span>
          </div>
        )}
        {item.caption && (
          <p className="text-sm leading-relaxed text-white drop-shadow-sm">{item.caption}</p>
        )}
      </div>
    </>
  );
}
