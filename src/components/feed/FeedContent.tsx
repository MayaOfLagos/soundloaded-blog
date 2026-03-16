"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { PostComposerCard } from "@/components/feed/PostComposerCard";
import { FeedPostList } from "@/components/feed/FeedPostList";
import { FeedTabs } from "@/components/feed/FeedTabs";

const ROLE_LEVELS: Record<string, number> = {
  READER: 0,
  CONTRIBUTOR: 1,
  EDITOR: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

export function FeedContent() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"foryou" | "following" | "discover">("foryou");

  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const canPost = (ROLE_LEVELS[userRole ?? "READER"] ?? 0) >= 1;

  return (
    <div className="mx-auto w-full max-w-[680px] px-0 sm:px-4 lg:px-0">
      {/* Composer card — only for logged-in CONTRIBUTOR+ users */}
      <PostComposerCard
        userAvatar={session?.user?.image}
        userName={session?.user?.name}
        canPost={canPost}
        className="mb-4"
      />

      {/* Feed tabs */}
      <FeedTabs activeTab={activeTab} onChange={setActiveTab} />

      {/* Feed post list with infinite scroll */}
      <FeedPostList feedType={activeTab} />
    </div>
  );
}
