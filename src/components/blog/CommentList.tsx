"use client";

import { CommentItem, type CommentData } from "./CommentItem";

interface CommentListProps {
  comments: CommentData[];
  onReply: (commentId: string, authorName: string) => void;
  maxDepth?: number;
}

export function CommentList({ comments, onReply, maxDepth = 2 }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No comments yet. Be the first to share your thoughts!
      </p>
    );
  }

  return (
    <div className="divide-border divide-y">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onReply={onReply}
          depth={1}
          maxDepth={maxDepth}
        />
      ))}
    </div>
  );
}
