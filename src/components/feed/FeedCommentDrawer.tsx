"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, MessageCircle } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { FeedCommentItem, type FeedComment } from "./FeedCommentItem";
import { FeedCommentInput } from "./FeedCommentInput";

interface FeedCommentDrawerProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CommentsResponse {
  comments: FeedComment[];
  total: number;
  commentsPerPage: number;
}

export function FeedCommentDrawer({ postId, open, onOpenChange }: FeedCommentDrawerProps) {
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

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto flex max-h-[85vh] w-full max-w-lg flex-col">
        <DrawerHeader className="border-border/40 border-b px-4 py-3">
          <DrawerTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-5 w-5" />
            Comments {total > 0 && `(${total})`}
          </DrawerTitle>
        </DrawerHeader>

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
              <p className="text-muted-foreground/70 mt-0.5 text-xs">Be the first to comment!</p>
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
        <DrawerFooter className="border-border/40 border-t px-4 py-3">
          <FeedCommentInput
            postId={postId}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
          />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
