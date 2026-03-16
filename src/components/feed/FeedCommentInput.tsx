"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Send, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { notify } from "@/hooks/useToast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface FeedCommentInputProps {
  postId: string;
  replyTo?: { id: string; name: string } | null;
  onCancelReply?: () => void;
}

export function FeedCommentInput({ postId, replyTo, onCancelReply }: FeedCommentInputProps) {
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

  return (
    <div className="space-y-2">
      {/* Replying to chip */}
      {replyTo && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
            Replying to <span className="text-foreground font-medium">@{replyTo.name}</span>
          </span>
          <button
            onClick={onCancelReply}
            className="text-muted-foreground hover:text-foreground rounded p-0.5 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={user?.image || ""} alt={user?.name || ""} />
          <AvatarFallback className="text-xs">
            {user?.name?.charAt(0)?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>

        <div className="bg-muted/60 flex min-h-[40px] flex-1 items-end rounded-2xl px-3 py-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={replyTo ? `Reply to ${replyTo.name}...` : "Write a comment..."}
            rows={1}
            maxLength={2000}
            className={cn(
              "max-h-24 w-full resize-none bg-transparent text-sm outline-none",
              "text-foreground placeholder:text-muted-foreground"
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
              target.style.height = Math.min(target.scrollHeight, 96) + "px";
            }}
          />
        </div>

        <button
          onClick={() => submitComment.mutate()}
          disabled={!body.trim() || submitComment.isPending}
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
            body.trim() ? "bg-brand hover:bg-brand/90 text-white" : "text-muted-foreground bg-muted"
          )}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
