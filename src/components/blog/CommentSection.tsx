"use client";

import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { MessageSquare } from "lucide-react";
import { CommentForm } from "./CommentForm";
import { CommentList } from "./CommentList";
import type { CommentData } from "./CommentItem";

interface CommentSectionProps {
  postId: string;
  enableComments: boolean;
  requireLoginToComment?: boolean;
  commentNestingDepth?: number;
  closeCommentsAfterDays?: number;
  publishedAt?: string | null;
}

export function CommentSection({
  postId,
  enableComments,
  requireLoginToComment = false,
  commentNestingDepth = 2,
  closeCommentsAfterDays = 0,
  publishedAt,
}: CommentSectionProps) {
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLDivElement>(null);
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    authorName: string;
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () =>
      axios
        .get<{ comments: CommentData[]; total: number }>(`/api/comments?postId=${postId}`)
        .then((r) => r.data),
    enabled: enableComments,
  });

  // Check if comments are time-closed
  const isTimeClosed = (() => {
    if (closeCommentsAfterDays <= 0 || !publishedAt) return false;
    const closedAt = new Date(publishedAt);
    closedAt.setDate(closedAt.getDate() + closeCommentsAfterDays);
    return new Date() > closedAt;
  })();

  if (!enableComments || isTimeClosed) {
    return (
      <div className="border-border rounded-lg border p-6 text-center">
        <p className="text-muted-foreground text-sm">Comments are closed on this post.</p>
      </div>
    );
  }

  const comments = data?.comments ?? [];
  const total = data?.total ?? 0;

  const handleReply = (commentId: string, authorName: string) => {
    setReplyingTo({ commentId, authorName });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleSuccess = () => {
    setReplyingTo(null);
    queryClient.invalidateQueries({ queryKey: ["comments", postId] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="text-muted-foreground h-5 w-5" />
        <h2 className="text-foreground text-lg font-bold">
          {isLoading
            ? "Comments"
            : total === 0
              ? "Leave a Comment"
              : `${total} Comment${total !== 1 ? "s" : ""}`}
        </h2>
      </div>

      <div ref={formRef}>
        <CommentForm
          postId={postId}
          parentId={replyingTo?.commentId}
          replyingToName={replyingTo?.authorName}
          onSuccess={handleSuccess}
          onCancelReply={() => setReplyingTo(null)}
          requireLogin={requireLoginToComment}
        />
      </div>

      {isLoading ? (
        <div className="space-y-4 py-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex animate-pulse gap-3">
              <div className="bg-muted h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="bg-muted h-4 w-24 rounded" />
                <div className="bg-muted h-3 w-full rounded" />
                <div className="bg-muted h-3 w-2/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <CommentList comments={comments} onReply={handleReply} maxDepth={commentNestingDepth} />
      )}
    </div>
  );
}
