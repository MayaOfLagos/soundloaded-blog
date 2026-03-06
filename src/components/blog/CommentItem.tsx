"use client";

import { formatRelativeDate } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

export interface CommentData {
  id: string;
  body: string;
  createdAt: string;
  guestName: string | null;
  guestWebsite: string | null;
  author: { id: string; name: string | null; image: string | null } | null;
  replies?: CommentData[];
}

interface CommentItemProps {
  comment: CommentData;
  onReply?: (commentId: string, authorName: string) => void;
  isReply?: boolean;
  depth?: number;
  maxDepth?: number;
}

export function CommentItem({
  comment,
  onReply,
  isReply,
  depth = 1,
  maxDepth = 2,
}: CommentItemProps) {
  const name = comment.author?.name ?? comment.guestName ?? "Anonymous";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const nameElement = comment.guestWebsite ? (
    <a
      href={comment.guestWebsite}
      target="_blank"
      rel="nofollow noopener noreferrer"
      className="text-foreground font-semibold hover:underline"
    >
      {name}
    </a>
  ) : (
    <span className="text-foreground font-semibold">{name}</span>
  );

  return (
    <div className={isReply ? "border-border ml-8 border-l-2 pl-4" : ""}>
      <div className="flex gap-3 py-4">
        <Avatar className="h-8 w-8 shrink-0">
          {comment.author?.image && <AvatarImage src={comment.author.image} alt={name} />}
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {nameElement}
            <span className="text-muted-foreground text-xs">
              {formatRelativeDate(comment.createdAt)}
            </span>
          </div>

          <p className="text-foreground/90 mt-1 text-sm leading-relaxed whitespace-pre-wrap">
            {comment.body}
          </p>

          {depth < maxDepth && onReply && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground mt-1 h-7 gap-1 px-2 text-xs"
              onClick={() => onReply(comment.id, name)}
            >
              <MessageSquare className="h-3 w-3" />
              Reply
            </Button>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies?.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          onReply={onReply}
          isReply
          depth={depth + 1}
          maxDepth={maxDepth}
        />
      ))}
    </div>
  );
}
