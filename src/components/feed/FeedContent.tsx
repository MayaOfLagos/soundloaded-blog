"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { PostComposerCard } from "@/components/feed/PostComposerCard";
import { FeedPostList } from "@/components/feed/FeedPostList";
import { FeedTabs } from "@/components/feed/FeedTabs";
import { StoryTray } from "@/components/stories/StoryTray";
import { Skeleton } from "@/components/ui/skeleton";

function ComposerSkeleton() {
  return (
    <div className="bg-card/50 ring-border/40 mb-4 animate-pulse rounded-2xl ring-1 backdrop-blur-sm">
      <div className="flex items-center gap-3 px-4 py-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-10 flex-1 rounded-full" />
        <div className="flex gap-1">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function StoryTraySkeleton() {
  return (
    <div className="mb-4 flex gap-2 overflow-hidden py-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="aspect-[9/16] h-40 flex-shrink-0 rounded-xl sm:h-48" />
      ))}
    </div>
  );
}

function TabsSkeleton() {
  return (
    <div className="bg-card/50 ring-border/40 mb-4 flex items-center gap-1 rounded-xl p-1 ring-1 backdrop-blur-sm">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-9 flex-1 rounded-lg" />
      ))}
    </div>
  );
}

export function FeedContent() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<"foryou" | "following" | "discover">("foryou");

  const isLoading = status === "loading";
  const canPost = !!session?.user;

  return (
    <div className="mx-auto w-full max-w-[680px] px-0 sm:px-4 lg:px-0">
      {/* Composer card */}
      {isLoading ? (
        <ComposerSkeleton />
      ) : (
        <PostComposerCard
          userAvatar={session?.user?.image}
          userName={session?.user?.name}
          canPost={canPost}
          className="mb-4"
        />
      )}

      {/* Stories */}
      {isLoading ? <StoryTraySkeleton /> : <StoryTray className="mb-4" />}

      {/* Feed tabs */}
      {isLoading ? <TabsSkeleton /> : <FeedTabs activeTab={activeTab} onChange={setActiveTab} />}

      {/* Feed post list with infinite scroll */}
      {!isLoading && <FeedPostList feedType={activeTab} />}
    </div>
  );
}
