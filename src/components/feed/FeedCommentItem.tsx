"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/lib/utils";
import { useCommentLike } from "@/hooks/useCommentLike";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { FeedCommentInput } from "./FeedCommentInput";

export interface FeedComment {
  id: string;
  body: string;
  createdAt: string;
  guestName: string | null;
  guestWebsite: string | null;
  author: { id: string; name: string | null; image: string | null } | null;
  likeCount: number;
  dislikeCount: number;
  userLike: string | null;
  replies?: FeedComment[];
}

interface FeedCommentItemProps {
  comment: FeedComment;
  postId: string;
  depth?: number;
  onReply?: (comment: { id: string; name: string }) => void;
}

export function FeedCommentItem({ comment, postId, depth = 0, onReply }: FeedCommentItemProps) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [likeState, setLikeState] = useState({
    userLike: comment.userLike,
    likeCount: comment.likeCount,
    dislikeCount: comment.dislikeCount,
  });

  const commentLike = useCommentLike(postId);

  const displayName = comment.author?.name || comment.guestName || "Guest";
  const avatarUrl = comment.author?.image || null;
  const maxDepth = 2;

  const handleLike = (type: "LIKE" | "DISLIKE") => {
    // Optimistic update
    setLikeState((prev) => {
      const wasActive = prev.userLike === type;
      const wasOpposite = prev.userLike && prev.userLike !== type;

      return {
        userLike: wasActive ? null : type,
        likeCount:
          type === "LIKE"
            ? prev.likeCount + (wasActive ? -1 : 1)
            : prev.likeCount - (wasOpposite && type === "DISLIKE" ? 1 : 0),
        dislikeCount:
          type === "DISLIKE"
            ? prev.dislikeCount + (wasActive ? -1 : 1)
            : prev.dislikeCount - (wasOpposite && type === "LIKE" ? 1 : 0),
      };
    });

    commentLike.mutate(
      { commentId: comment.id, type },
      {
        onSuccess: (data) => {
          setLikeState({
            userLike: data.userLike,
            likeCount: data.likeCount,
            dislikeCount: data.dislikeCount,
          });
        },
        onError: () => {
          // Revert on error
          setLikeState({
            userLike: comment.userLike,
            likeCount: comment.likeCount,
            dislikeCount: comment.dislikeCount,
          });
        },
      }
    );
  };

  return (
    <div className={cn("relative", depth > 0 && "mt-2 ml-6")}>
      {/* Timeline connector for replies */}
      {depth > 0 && <div className="border-border/60 absolute top-0 bottom-0 -left-3 border-l-2" />}

      <div className="flex gap-2.5">
        {/* Avatar */}
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={avatarUrl || ""} alt={displayName} />
          <AvatarFallback className="text-[11px]">
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          {/* Comment bubble */}
          <div className="bg-muted/50 rounded-2xl px-3 py-2">
            <div className="flex items-center gap-1.5">
              <span className="text-foreground text-[13px] leading-tight font-semibold">
                {displayName}
              </span>
              <span className="text-muted-foreground text-[11px]">
                · {formatRelativeDate(comment.createdAt)}
              </span>
            </div>
            <p className="text-foreground mt-0.5 text-[13px] leading-relaxed whitespace-pre-wrap">
              {comment.body}
            </p>
          </div>

          {/* Action buttons */}
          <div className="mt-1 flex items-center gap-3 px-1">
            {/* Like */}
            <button
              onClick={() => handleLike("LIKE")}
              className={cn(
                "flex items-center gap-1 text-[11px] font-medium transition-colors",
                likeState.userLike === "LIKE"
                  ? "text-brand"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ThumbsUp
                className={cn("h-3.5 w-3.5", likeState.userLike === "LIKE" && "fill-current")}
              />
              {likeState.likeCount > 0 && likeState.likeCount}
            </button>

            {/* Dislike */}
            <button
              onClick={() => handleLike("DISLIKE")}
              className={cn(
                "flex items-center gap-1 text-[11px] font-medium transition-colors",
                likeState.userLike === "DISLIKE"
                  ? "text-red-500"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ThumbsDown
                className={cn("h-3.5 w-3.5", likeState.userLike === "DISLIKE" && "fill-current")}
              />
              {likeState.dislikeCount > 0 && likeState.dislikeCount}
            </button>

            {/* Reply button (only show if not at max depth) */}
            {depth < maxDepth && (
              <button
                onClick={() => {
                  if (onReply) {
                    onReply({ id: comment.id, name: displayName });
                  } else {
                    setShowReplyInput((prev) => !prev);
                  }
                }}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-[11px] font-medium transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Reply
              </button>
            )}
          </div>

          {/* Inline reply input */}
          {showReplyInput && (
            <div className="mt-2">
              <FeedCommentInput
                postId={postId}
                replyTo={{ id: comment.id, name: displayName }}
                onCancelReply={() => setShowReplyInput(false)}
              />
            </div>
          )}

          {/* Nested replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2 space-y-2">
              {comment.replies.map((reply) => (
                <FeedCommentItem key={reply.id} comment={reply} postId={postId} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
