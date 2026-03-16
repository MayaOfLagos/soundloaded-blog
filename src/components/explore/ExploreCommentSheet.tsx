"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, MessageCircle, X } from "lucide-react";
import { FeedCommentItem, type FeedComment } from "@/components/feed/FeedCommentItem";
import { ExploreCommentInput } from "./ExploreCommentInput";

interface ExploreCommentSheetProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CommentsResponse {
  comments: FeedComment[];
  total: number;
  commentsPerPage: number;
}

export function ExploreCommentSheet({ postId, open, onOpenChange }: ExploreCommentSheetProps) {
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["feed-comments", postId],
    queryFn: async () => {
      const { data } = await axios.get<CommentsResponse>(`/api/comments?postId=${postId}`);
      return data;
    },
    enabled: open,
    staleTime: 30_000,
  });

  const comments = data?.comments ?? [];
  const total = data?.total ?? 0;

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    },
    [onOpenChange]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  // Reset reply state when closing
  useEffect(() => {
    if (!open) setReplyTo(null); // eslint-disable-line react-hooks/set-state-in-effect
  }, [open]);

  // Portal to document.body so the sheet renders above all content
  // (the card has overflow-hidden which clips fixed children)
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 350,
              mass: 0.8,
            }}
            className="bg-background absolute inset-x-0 bottom-0 z-10 mx-auto flex max-h-[75vh] w-full max-w-lg flex-col rounded-t-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle indicator */}
            <div className="absolute top-1.5 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-gray-300 dark:bg-gray-600" />

            {/* Header */}
            <div className="border-border/40 flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                <h3 className="text-base font-semibold">
                  Comments{total > 0 ? ` (${total})` : ""}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="text-muted-foreground hover:text-foreground hover:bg-muted -mr-1 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                aria-label="Close comments"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable comment list */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="text-brand h-6 w-6 animate-spin" />
                  <p className="text-muted-foreground mt-2 text-sm">Loading comments...</p>
                </div>
              )}

              {isError && (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground text-sm">Failed to load comments</p>
                </div>
              )}

              {!isLoading && !isError && comments.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                  <MessageCircle className="text-muted-foreground/50 h-10 w-10" />
                  <p className="text-muted-foreground mt-2 text-sm">No comments yet</p>
                  <p className="text-muted-foreground/70 mt-0.5 text-xs">
                    Be the first to comment!
                  </p>
                </div>
              )}

              {!isLoading && comments.length > 0 && (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <FeedCommentItem
                      key={comment.id}
                      comment={comment}
                      postId={postId}
                      onReply={(target) => setReplyTo(target)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Fixed bottom: comment input */}
            <div className="border-border/40 border-t px-4 py-3">
              <ExploreCommentInput
                postId={postId}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
