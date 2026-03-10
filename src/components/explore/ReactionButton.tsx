"use client";

import { useState, useRef, useCallback, useEffect, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Heart } from "lucide-react";
import { useReactionCheck, useSetReaction, useRemoveReaction } from "@/hooks/useReactions";
import { REACTION_EMOJIS } from "@/lib/api/reactions";
import { cn } from "@/lib/utils";

import data from "@emoji-mart/data";

const Picker = lazy(() => import("@emoji-mart/react").then((mod) => ({ default: mod.default })));

interface ReactionButtonProps {
  postId: string;
  reactionCount: number;
  className?: string;
}

export function ReactionButton({ postId, reactionCount, className }: ReactionButtonProps) {
  const { status } = useSession();
  const { data: reactionState } = useReactionCheck(postId);
  const setReaction = useSetReaction();
  const removeReaction = useRemoveReaction();

  const [showPanel, setShowPanel] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [bounceKey, setBounceKey] = useState(0);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const userReaction = reactionState?.userReaction ?? null;
  const displayCount = reactionState?.counts?.total ?? reactionCount;

  // Close picker on outside click or Escape
  useEffect(() => {
    if (!showPicker) return;
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowPicker(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showPicker]);

  const handleMouseEnter = useCallback(() => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setShowPanel(true), 300);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    leaveTimerRef.current = setTimeout(() => setShowPanel(false), 200);
  }, []);

  const handleClick = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    if (userReaction) {
      removeReaction.mutate({ postId });
    } else {
      setReaction.mutate({ postId, emoji: "❤️" });
      setBounceKey((k) => k + 1);
    }
  }, [userReaction, postId, removeReaction, setReaction]);

  const handleReactionSelect = useCallback(
    (emoji: string) => {
      setReaction.mutate({ postId, emoji });
      setShowPanel(false);
      setBounceKey((k) => k + 1);
    },
    [postId, setReaction]
  );

  const handlePickerSelect = useCallback(
    (emojiData: { native: string }) => {
      setReaction.mutate({ postId, emoji: emojiData.native });
      setShowPicker(false);
      setBounceKey((k) => k + 1);
    },
    [postId, setReaction]
  );

  // Unauthenticated — redirect to login
  if (status !== "authenticated") {
    return (
      <Link
        href="/login"
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <Heart className="h-5 w-5" />
      </Link>
    );
  }

  return (
    <>
      <div
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Quick Reaction Panel (slides in on hover) ── */}
        <AnimatePresence>
          {showPanel && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="absolute right-0 bottom-full z-20 mb-2"
            >
              <div className="bg-popover/95 border-border flex items-center gap-1 rounded-full border px-2.5 py-2 shadow-xl backdrop-blur-md">
                {REACTION_EMOJIS.map((reaction) => (
                  <motion.button
                    key={reaction.emoji}
                    whileHover={{ scale: 1.4, y: -4 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", damping: 15, stiffness: 400 }}
                    onClick={() => handleReactionSelect(reaction.emoji)}
                    className="hover:bg-muted relative flex h-10 w-10 items-center justify-center rounded-full text-2xl transition-colors"
                    title={reaction.label}
                  >
                    {reaction.emoji}
                  </motion.button>
                ))}

                {/* Show All button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowPanel(false);
                    setShowPicker(true);
                  }}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted ml-0.5 flex h-10 items-center rounded-full px-2 text-[10px] font-semibold whitespace-nowrap transition-colors"
                >
                  + All
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main Reaction Button ── */}
        <motion.button
          key={bounceKey}
          initial={bounceKey > 0 ? { scale: 1.3 } : false}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 10, stiffness: 400 }}
          onClick={handleClick}
          disabled={setReaction.isPending || removeReaction.isPending}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-colors hover:bg-black/60",
            userReaction ? "text-red-500" : "text-white",
            className
          )}
          aria-label={userReaction ? `Reacted with ${userReaction.emoji}` : "React"}
        >
          {userReaction ? (
            <span className="text-xl leading-none">{userReaction.emoji}</span>
          ) : (
            <Heart className="h-5 w-5" />
          )}
        </motion.button>
      </div>

      {/* Reaction count */}
      <span className="text-center text-[11px] font-semibold text-white/90">
        {formatCount(displayCount)}
      </span>

      {/* ── Full Emoji Picker (portal to escape overflow-hidden) ── */}
      {showPicker &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
              onClick={() => setShowPicker(false)}
            >
              <motion.div
                ref={pickerRef}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                onClick={(e) => e.stopPropagation()}
                className="overflow-hidden rounded-xl shadow-2xl"
              >
                <Suspense
                  fallback={
                    <div className="bg-popover border-border flex h-[350px] w-[352px] items-center justify-center rounded-xl border">
                      <div className="border-brand h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
                    </div>
                  }
                >
                  <Picker
                    data={data}
                    onEmojiSelect={handlePickerSelect}
                    theme="dark"
                    set="native"
                    perLine={8}
                    previewPosition="none"
                    skinTonePosition="search"
                    maxFrequentRows={2}
                  />
                </Suspense>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
