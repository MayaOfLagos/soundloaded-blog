"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFollowSuggestions, useToggleFollow, useFollowCheck } from "@/hooks/useFollow";
import { StoryViewer } from "./StoryViewer";
import { cn } from "@/lib/utils";
import "./stories.css";
import type { StoryGroupResponse } from "@/app/api/stories/route";

interface StoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storyGroups: StoryGroupResponse[];
}

function FollowButton({ userId }: { userId: string }) {
  const { data } = useFollowCheck(userId);
  const toggleFollow = useToggleFollow();
  const isFollowing = data?.following ?? false;

  return (
    <button
      onClick={() => toggleFollow.mutate({ userId, isFollowing })}
      disabled={toggleFollow.isPending}
      className={cn(
        "rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors",
        isFollowing
          ? "bg-muted text-foreground hover:bg-muted/80"
          : "bg-brand hover:bg-brand/90 text-white"
      )}
    >
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}

export function StoriesDialog({ open, onOpenChange, storyGroups }: StoriesDialogProps) {
  const { data: suggestions } = useFollowSuggestions();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Stories</DialogTitle>
          </DialogHeader>

          {/* Stories from followed creators */}
          {storyGroups.length > 0 && (
            <div>
              <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                Creators You Follow
              </p>
              <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-2">
                {storyGroups.map((group, i) => (
                  <button
                    key={group.author.id}
                    onClick={() => {
                      onOpenChange(false);
                      setViewerIndex(i);
                    }}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div
                      className={cn(
                        "flex h-16 w-16 items-center justify-center rounded-full p-[3px]",
                        group.hasUnviewed ? "story-ring-unseen" : "story-ring-seen"
                      )}
                    >
                      <div className="bg-background flex h-full w-full items-center justify-center overflow-hidden rounded-full">
                        {group.author.image ? (
                          <Image
                            src={group.author.image}
                            alt={group.author.name ?? ""}
                            width={56}
                            height={56}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-muted-foreground text-sm font-bold">
                            {group.author.name?.[0]?.toUpperCase() ?? "?"}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-foreground max-w-[64px] truncate text-[10px] font-medium">
                      {group.author.name ?? "User"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Creators you may know */}
          {suggestions && suggestions.length > 0 && (
            <div className="mt-4">
              <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                Creators You May Know
              </p>
              <div className="space-y-2">
                {suggestions.map((user) => (
                  <div
                    key={user.id}
                    className="hover:bg-muted flex items-center gap-3 rounded-xl p-2 transition-colors"
                  >
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name ?? ""}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold">
                        {user.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground truncate text-sm font-semibold">
                        {user.name ?? "User"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {user.followerCount} followers &middot; {user.postCount} posts
                      </p>
                    </div>
                    <FollowButton userId={user.id} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {storyGroups.length === 0 && (!suggestions || suggestions.length === 0) && (
            <div className="py-10 text-center">
              <p className="text-muted-foreground text-sm">
                Follow creators to see their stories here.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Story viewer (outside dialog) */}
      {viewerIndex !== null && (
        <StoryViewer
          storyGroups={storyGroups}
          initialGroupIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </>
  );
}
