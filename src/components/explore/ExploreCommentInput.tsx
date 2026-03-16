"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { motion, AnimatePresence } from "motion/react";
import { Send, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { notify } from "@/hooks/useToast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ExploreCommentInputProps {
  postId: string;
  replyTo?: { id: string; name: string } | null;
  onCancelReply?: () => void;
}

/** Animated placeholder text — letter-by-letter spring entrance (from morphing-input) */
function AnimatedPlaceholder({ text }: { text: string }) {
  const letters = text.split("");

  return (
    <motion.span className="inline-flex overflow-hidden">
      {letters.map((letter, index) => (
        <motion.span
          key={`${text}-${index}`}
          initial={{ opacity: 0, rotateX: "80deg", y: 8, filter: "blur(3px)" }}
          animate={{ opacity: 1, rotateX: "0deg", y: 0, filter: "blur(0px)" }}
          transition={{
            delay: 0.015 * index,
            type: "spring",
            damping: 16,
            stiffness: 240,
            mass: 1.2,
          }}
          style={{ willChange: "transform" }}
          className="inline-block"
        >
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </motion.span>
  );
}

export function ExploreCommentInput({ postId, replyTo, onCancelReply }: ExploreCommentInputProps) {
  const { data: session, status } = useSession();
  const [body, setBody] = useState("");
  const queryClient = useQueryClient();

  const user = session?.user as { id?: string; name?: string; image?: string } | undefined;

  const submitComment = useMutation({
    mutationFn: async () => {
      const { data } = await axios.post("/api/comments", {
        postId,
        body: body.trim(),
        parentId: replyTo?.id,
      });
      return data;
    },
    onSuccess: () => {
      setBody("");
      onCancelReply?.();
      queryClient.invalidateQueries({ queryKey: ["feed-comments", postId] });
      notify.success("Comment posted");
    },
    onError: () => {
      notify.error("Failed to post comment");
    },
  });

  if (status !== "authenticated") {
    return (
      <div className="flex items-center justify-center py-3">
        <Link href="/login" className="text-brand text-sm font-medium hover:underline">
          Log in to comment
        </Link>
      </div>
    );
  }

  const placeholderText = replyTo ? `Reply to ${replyTo.name}...` : "Write a comment...";

  return (
    <div className="space-y-2">
      {/* Replying-to chip */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 overflow-hidden"
          >
            <span className="text-muted-foreground text-xs">
              Replying to <span className="text-foreground font-medium">@{replyTo.name}</span>
            </span>
            <button
              type="button"
              onClick={onCancelReply}
              className="text-muted-foreground hover:text-foreground rounded p-0.5 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Morphing-input-styled pill container */}
      <div className="bg-muted/60 flex w-full items-center rounded-full px-1 py-1">
        {/* Avatar (left) */}
        <Avatar className="ml-0.5 h-8 w-8 shrink-0">
          <AvatarImage src={user?.image || ""} alt={user?.name || ""} />
          <AvatarFallback className="text-xs">
            {user?.name?.charAt(0)?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>

        {/* Input area (center) */}
        <div className="relative min-w-0 flex-1">
          {!body && (
            <div className="pointer-events-none absolute top-0 left-0 flex h-full w-full items-center overflow-hidden bg-transparent pl-2.5">
              <div className="text-muted-foreground text-sm whitespace-nowrap">
                <AnimatedPlaceholder key={placeholderText} text={placeholderText} />
              </div>
            </div>
          )}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={1}
            maxLength={2000}
            className={cn(
              "max-h-20 w-full resize-none bg-transparent py-2 pr-1 pl-2.5 text-sm outline-none",
              "text-foreground"
            )}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (body.trim() && !submitComment.isPending) {
                  submitComment.mutate();
                }
              }
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 80) + "px";
            }}
          />
        </div>

        {/* Send button (right) */}
        <motion.button
          type="button"
          onClick={() => {
            if (body.trim() && !submitComment.isPending) {
              submitComment.mutate();
            }
          }}
          disabled={!body.trim() || submitComment.isPending}
          whileTap={{ scale: 0.9 }}
          className={cn(
            "flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full shadow-sm transition-all duration-150 ease-in-out",
            body.trim()
              ? "bg-brand hover:bg-brand/90 text-white"
              : "bg-background text-muted-foreground"
          )}
        >
          <Send className="h-4 w-4" />
        </motion.button>
      </div>
    </div>
  );
}
