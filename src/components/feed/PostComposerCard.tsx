"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { CreatePostDialog } from "./CreatePostDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Facebook-style filled SVG icons
function PhotoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="3" width="20" height="18" rx="3" fill="#45BD62" />
      <circle cx="8.5" cy="9.5" r="2.5" fill="#E7F3E8" />
      <path
        d="M2 17l5.5-6a1.5 1.5 0 012.2 0L14 15.5l2.3-2.3a1.5 1.5 0 012.2 0L22 17v1a3 3 0 01-3 3H5a3 3 0 01-3-3v-1z"
        fill="#B4DDB7"
      />
    </svg>
  );
}

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="1" y="4" width="16" height="16" rx="3" fill="#F3425F" />
      <path d="M19 8.5l3.2-2.1A.8.8 0 0123.5 7v10a.8.8 0 01-1.3.6L19 15.5V8.5z" fill="#F3425F" />
      <path d="M9 10v4l3.5-2L9 10z" fill="#FCE4EC" />
    </svg>
  );
}

function MusicIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="10" fill="#A033FF" />
      <path
        d="M10 7.5v7m0 0a2.5 2.5 0 11-2.5-2.5H10zm5-5v7m0 0a2.5 2.5 0 11-2.5-2.5H15z"
        stroke="#E8D5FF"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface PostComposerCardProps {
  userAvatar?: string | null;
  userName?: string | null;
  /** Whether user has CONTRIBUTOR+ role (can create posts) */
  canPost?: boolean;
  className?: string;
}

export function PostComposerCard({
  userAvatar,
  userName,
  canPost = false,
  className,
}: PostComposerCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!canPost) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn("bg-card/50 ring-border/40 rounded-2xl ring-1 backdrop-blur-sm", className)}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          {/* User avatar */}
          <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full">
            {userAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userAvatar} alt={userName || ""} className="h-full w-full object-cover" />
            ) : (
              <span className="text-muted-foreground text-sm font-semibold">
                {userName?.charAt(0)?.toUpperCase() || "?"}
              </span>
            )}
          </div>

          {/* Fake input — opens dialog */}
          <button
            onClick={() => setDialogOpen(true)}
            className={cn(
              "flex-1 cursor-pointer rounded-full px-4 py-2.5 text-left text-sm transition-colors",
              "bg-muted/60 text-muted-foreground hover:bg-muted"
            )}
          >
            What&apos;s on your mind, {userName?.split(" ")[0] || "there"}?
          </button>

          {/* Action icons */}
          <TooltipProvider delayDuration={200}>
            <div className="flex shrink-0 items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setDialogOpen(true)}
                    className="hover:bg-muted flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
                  >
                    <PhotoIcon className="h-[22px] w-[22px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  Photo
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setDialogOpen(true)}
                    className="hover:bg-muted flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
                  >
                    <VideoIcon className="h-[22px] w-[22px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  Video
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setDialogOpen(true)}
                    className="hover:bg-muted flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
                  >
                    <MusicIcon className="h-[22px] w-[22px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  Music
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </motion.div>

      {/* Create post dialog */}
      <CreatePostDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        userAvatar={userAvatar}
        userName={userName}
      />
    </>
  );
}
