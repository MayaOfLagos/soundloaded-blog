"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Music } from "lucide-react";
import { Howl } from "howler";
import { Button } from "@/components/ui/button";

interface StoryPreviewProps {
  type: "photo" | "video" | "text";
  // Photo/Video
  filePreviewUrl?: string;
  // Text
  textContent?: string;
  backgroundColor?: string;
  // Common
  caption?: string;
  // Audio
  audioUrl?: string;
  audioStartTime?: number;
  audioEndTime?: number;
  // Actions
  isPosting: boolean;
  postProgress: number;
  onPost: () => void;
  onBack: () => void;
}

export function StoryPreview({
  type,
  filePreviewUrl,
  textContent,
  backgroundColor,
  caption,
  audioUrl,
  audioStartTime = 0,
  audioEndTime = 30,
  isPosting,
  postProgress,
  onPost,
  onBack,
}: StoryPreviewProps) {
  const howlRef = useRef<Howl | null>(null);

  // Play audio preview
  useEffect(() => {
    if (!audioUrl) return;

    const howl = new Howl({
      src: [audioUrl],
      onload: () => {
        howl.seek(audioStartTime);
        howl.play();
      },
    });
    howlRef.current = howl;

    const timer = setInterval(() => {
      const current = howl.seek() as number;
      if (current >= audioEndTime) {
        howl.seek(audioStartTime);
      }
    }, 200);

    return () => {
      clearInterval(timer);
      howl.unload();
    };
  }, [audioUrl, audioStartTime, audioEndTime]);

  return (
    <div className="flex h-full flex-col">
      {/* Preview */}
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="relative mx-auto aspect-[9/16] w-full max-w-xs overflow-hidden rounded-2xl bg-black shadow-2xl">
          {type === "text" ? (
            <div
              className="flex h-full w-full items-center justify-center p-8"
              style={{ background: backgroundColor }}
            >
              <p className="text-center text-2xl font-bold text-white drop-shadow-lg">
                {textContent}
              </p>
            </div>
          ) : type === "video" ? (
            <video
              src={filePreviewUrl}
              className="h-full w-full object-cover"
              autoPlay
              loop
              playsInline
              muted
            />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={filePreviewUrl} alt="Story preview" className="h-full w-full object-cover" />
          )}

          {/* Caption overlay */}
          {caption && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-10">
              <p className="text-sm font-medium text-white">{caption}</p>
            </div>
          )}

          {/* Audio indicator */}
          {audioUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 backdrop-blur-sm"
            >
              <Music className="h-3 w-3 text-white" />
              <span className="text-[10px] font-medium text-white">Playing</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Posting progress */}
      {isPosting && (
        <div className="px-4">
          <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
            <motion.div
              className="bg-brand h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${postProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-muted-foreground mt-1 text-center text-xs">Posting your story...</p>
        </div>
      )}

      {/* Footer */}
      <div className="border-border flex gap-2 border-t p-4">
        <Button variant="outline" className="flex-1" onClick={onBack} disabled={isPosting}>
          Back
        </Button>
        <Button className="bg-brand hover:bg-brand/90 flex-1" onClick={onPost} disabled={isPosting}>
          {isPosting ? "Posting..." : "Post Story"}
        </Button>
      </div>
    </div>
  );
}
