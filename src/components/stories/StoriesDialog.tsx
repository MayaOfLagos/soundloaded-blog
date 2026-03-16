"use client";

import { useState } from "react";
import Image from "next/image";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useFollowSuggestions, useToggleFollow, useFollowCheck } from "@/hooks/useFollow";
import { StoriesPlayer } from "./StoriesConfig";
import { cn } from "@/lib/utils";
import type { StoryGroupResponse } from "@/app/api/stories/route";

import "./stories.css";

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
      type="button"
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

function StoryGridCard({ group, onClick }: { group: StoryGroupResponse; onClick: () => void }) {
  const firstStory = group.stories[0];
  const coverUrl = firstStory?.type !== "TEXT" ? firstStory?.mediaUrl : undefined;
  const coverBg =
    firstStory?.backgroundColor ?? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative aspect-[9/16] w-full overflow-hidden rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98]",
        group.hasUnviewed ? "story-card-unseen" : "story-card-seen"
      )}
    >
      {coverUrl ? (
        firstStory?.type === "VIDEO" ? (
          <video
            src={coverUrl}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <Image
            src={coverUrl}
            alt={group.author.name ?? "Story"}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 33vw, 20vw"
          />
        )
      ) : (
        <div className="absolute inset-0" style={{ background: coverBg }} />
      )}

      {firstStory?.type === "TEXT" && firstStory.textContent && (
        <p className="absolute inset-0 flex items-center justify-center p-3 text-center text-[10px] leading-tight font-semibold text-white">
          {firstStory.textContent.slice(0, 80)}
          {(firstStory.textContent.length ?? 0) > 80 ? "…" : ""}
        </p>
      )}

      <div className="absolute inset-x-0 bottom-0 z-[1] flex items-center gap-1.5 p-2">
        {coverUrl && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 to-transparent" />
        )}
        <div className="relative z-[2] flex items-center gap-1.5">
          <div className="h-7 w-7 flex-shrink-0 overflow-hidden rounded-full ring-2 ring-blue-500">
            {group.author.image ? (
              <Image
                src={group.author.image}
                alt={group.author.name ?? ""}
                width={28}
                height={28}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-white/20 text-[9px] font-bold text-white">
                {group.author.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
          <span className="truncate text-[10px] font-semibold text-white drop-shadow-sm">
            {group.author.name ?? "User"}
          </span>
        </div>
      </div>
    </button>
  );
}

function SuggestionCard({
  user,
}: {
  user: {
    id: string;
    name: string | null;
    image: string | null;
    followerCount: number;
    postCount: number;
  };
}) {
  return (
    <div className="border-border/60 hover:bg-muted/50 flex items-center gap-3 rounded-xl border p-3 transition-colors">
      {user.image ? (
        <Image
          src={user.image}
          alt={user.name ?? ""}
          width={44}
          height={44}
          className="rounded-full"
        />
      ) : (
        <div className="bg-muted flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold">
          {user.name?.[0]?.toUpperCase() ?? "?"}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm font-semibold">{user.name ?? "User"}</p>
        <p className="text-muted-foreground text-xs">
          {user.followerCount} followers &middot; {user.postCount} posts
        </p>
      </div>
      <FollowButton userId={user.id} />
    </div>
  );
}

function StoriesDialogBody({
  storyGroups,
  suggestions,
}: {
  storyGroups: StoryGroupResponse[];
  suggestions:
    | Array<{
        id: string;
        name: string | null;
        image: string | null;
        followerCount: number;
        postCount: number;
      }>
    | undefined;
}) {
  const [viewerGroups, setViewerGroups] = useState<StoryGroupResponse[] | null>(null);

  return (
    <>
      {storyGroups.length > 0 && (
        <div className="px-4 pb-2 sm:px-0">
          <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
            Creators You Follow
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
            {storyGroups.map((group, idx) => (
              <StoryGridCard
                key={group.author.id}
                group={group}
                onClick={() => {
                  const reordered = [...storyGroups.slice(idx), ...storyGroups.slice(0, idx)];
                  setViewerGroups(reordered);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {suggestions && suggestions.length > 0 && (
        <div className="mt-4 px-4 pb-4 sm:px-0">
          <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
            Creators You May Know
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {suggestions.map((user) => (
              <SuggestionCard key={user.id} user={user} />
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

      {viewerGroups && (
        <div
          className="fixed inset-0 z-[60] bg-black"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewerGroups(null);
          }}
        >
          <button
            type="button"
            onClick={() => setViewerGroups(null)}
            className="absolute top-4 right-4 z-[70] flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Close viewer"
          >
            <svg height="24" viewBox="0 0 24 24" width="24">
              <path
                d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                fill="#ffffff"
              />
            </svg>
          </button>
          <div className="flex h-full items-center justify-center">
            <StoriesPlayer groups={viewerGroups} autoOpen />
          </div>
        </div>
      )}
    </>
  );
}

export function StoriesDialog({ open, onOpenChange, storyGroups }: StoriesDialogProps) {
  const { data: suggestions } = useFollowSuggestions();
  const isDesktop = useMediaQuery("(min-width: 640px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Stories</DialogTitle>
          </DialogHeader>
          <StoriesDialogBody storyGroups={storyGroups} suggestions={suggestions} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Stories</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto">
          <StoriesDialogBody storyGroups={storyGroups} suggestions={suggestions} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
