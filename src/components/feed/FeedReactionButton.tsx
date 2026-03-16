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

interface FeedReactionButtonProps {
  postId: string;
  reactionCount: number;
}

/**
 * Inline reaction button adapted for FeedPostCard's horizontal action bar.
 * Shows emoji hover panel above, renders as a text+icon row button.
 */
export function FeedReactionButton({ postId, reactionCount }: FeedReactionButtonProps) {
  const { status } = useSession();
  const { data: reactionState } = useReactionCheck(postId);
  const setReaction = useSetReaction();
  const removeReaction = useRemoveReaction();

  const [showPanel, setShowPanel] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [bounceKey, setBounceKey] = useState(0);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
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
    if (status !== "authenticated") return;
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setShowPanel(true), 400);
  }, [status]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    leaveTimerRef.current = setTimeout(() => setShowPanel(false), 250);
  }, []);

  // Mobile long-press handlers
  const handleTouchStart = useCallback(() => {
    if (status !== "authenticated") return;
    longPressTimerRef.current = setTimeout(() => setShowPanel(true), 500);
  }, [status]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  }, []);

  const handleClick = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    if (showPanel) return; // Don't toggle when panel is visible
    if (userReaction) {
      removeReaction.mutate({ postId });
    } else {
      setReaction.mutate({ postId, emoji: "❤️" });
      setBounceKey((k) => k + 1);
    }
  }, [userReaction, postId, removeReaction, setReaction, showPanel]);

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
        className="text-muted-foreground hover:bg-muted flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[15px] font-medium transition-colors"
      >
        <Heart className="h-[18px] w-[18px]" />
        <span className="hidden sm:inline">Like</span>
      </Link>
    );
  }

  return (
    <>
      <div
        className="relative flex flex-1"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* ── Quick Reaction Panel (centered above button) ── */}
        <AnimatePresence>
          {showPanel && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2"
            >
              <div className="border-border bg-card flex items-center gap-1 rounded-3xl border-[0.5px] px-2.5 py-1.5 shadow-lg">
                {REACTION_EMOJIS.map((reaction) => (
                  <motion.button
                    key={reaction.emoji}
                    type="button"
                    whileHover={{ scale: 1.3, y: -4 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", damping: 15, stiffness: 400 }}
                    onClick={() => handleReactionSelect(reaction.emoji)}
                    className="group relative flex cursor-pointer flex-col items-center gap-0.5 rounded-lg px-1.5 py-1 text-[26px] leading-none"
                    title={reaction.label}
                    role="menuitem"
                  >
                    {reaction.emoji}
                    <span className="text-muted-foreground text-[10px] font-semibold opacity-0 transition-opacity group-hover:opacity-100">
                      {reaction.label}
                    </span>
                  </motion.button>
                ))}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowPanel(false);
                    setShowPicker(true);
                  }}
                  className="text-muted-foreground hover:bg-muted hover:text-foreground ml-0.5 flex h-9 items-center rounded-full px-2 text-[10px] font-semibold whitespace-nowrap transition-colors"
                  role="menuitem"
                >
                  + All
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main Button ── */}
        <motion.button
          type="button"
          key={bounceKey}
          initial={bounceKey > 0 ? { scale: 1.15 } : false}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 10, stiffness: 400 }}
          onClick={handleClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          disabled={setReaction.isPending || removeReaction.isPending}
          aria-pressed={!!userReaction}
          aria-label={userReaction ? userReaction.emoji : "Like"}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[15px] font-medium transition-colors",
            userReaction ? "text-rose-500" : "text-muted-foreground hover:bg-muted"
          )}
        >
          {userReaction ? (
            <span className="text-lg leading-none">{userReaction.emoji}</span>
          ) : (
            <Heart className="h-[18px] w-[18px]" />
          )}
          <span className="hidden sm:inline">
            {userReaction
              ? displayCount > 0
                ? formatCount(displayCount)
                : userReaction.emoji
              : "Like"}
          </span>
        </motion.button>
      </div>

      {/* ── Full Emoji Picker (portal) ── */}
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
                    <div className="border-border bg-popover flex h-[350px] w-[352px] items-center justify-center rounded-xl border">
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
