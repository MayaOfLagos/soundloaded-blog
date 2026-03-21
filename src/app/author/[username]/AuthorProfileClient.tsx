"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useFollowCheck, useToggleFollow } from "@/hooks/useFollow";
import { PostCard, type PostCardData } from "@/components/blog/PostCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Loader2, Newspaper, Rss } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthorProfileClientProps {
  authorId: string;
  authorName: string;
  editorialPosts: PostCardData[];
  communityPosts: PostCardData[];
}

export function AuthorProfileClient({
  authorId,
  authorName,
  editorialPosts,
  communityPosts,
}: AuthorProfileClientProps) {
  const { data: session } = useSession();
  const currentUserId = (session?.user as { id?: string } | undefined)?.id;
  const isOwnProfile = currentUserId === authorId;

  const { data: followStatus } = useFollowCheck(isOwnProfile ? undefined : authorId);
  const toggleFollow = useToggleFollow();

  const [activeTab, setActiveTab] = useState<"articles" | "feed">("articles");

  const isFollowing = followStatus?.following ?? false;

  return (
    <>
      {/* Follow button */}
      {!isOwnProfile && session?.user && (
        <div className="mt-4">
          <Button
            size="sm"
            variant={isFollowing ? "outline" : "default"}
            className={cn(
              "gap-1.5",
              !isFollowing && "bg-brand hover:bg-brand/90 text-brand-foreground"
            )}
            disabled={toggleFollow.isPending}
            onClick={() =>
              toggleFollow.mutate({
                userId: authorId,
                isFollowing,
              })
            }
          >
            {toggleFollow.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isFollowing ? (
              <UserCheck className="h-4 w-4" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {isFollowing ? "Following" : "Follow"}
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="mt-8">
        <div className="border-border flex gap-1 border-b">
          <button
            type="button"
            onClick={() => setActiveTab("articles")}
            className={cn(
              "relative px-4 py-2.5 text-sm font-medium transition-colors",
              activeTab === "articles"
                ? "text-brand"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="flex items-center gap-1.5">
              <Newspaper className="h-4 w-4" />
              Articles
              {editorialPosts.length > 0 && (
                <span className="text-muted-foreground text-xs">({editorialPosts.length})</span>
              )}
            </span>
            {activeTab === "articles" && (
              <span className="bg-brand absolute right-0 bottom-0 left-0 h-0.5 rounded-full" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("feed")}
            className={cn(
              "relative px-4 py-2.5 text-sm font-medium transition-colors",
              activeTab === "feed" ? "text-brand" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="flex items-center gap-1.5">
              <Rss className="h-4 w-4" />
              Feed Posts
              {communityPosts.length > 0 && (
                <span className="text-muted-foreground text-xs">({communityPosts.length})</span>
              )}
            </span>
            {activeTab === "feed" && (
              <span className="bg-brand absolute right-0 bottom-0 left-0 h-0.5 rounded-full" />
            )}
          </button>
        </div>

        {/* Tab content */}
        <div className="mt-5">
          {activeTab === "articles" ? (
            editorialPosts.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {editorialPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Newspaper}
                title="No articles yet"
                description={`${authorName} hasn't published any articles yet.`}
                actionLabel="Browse Content"
                actionHref="/"
              />
            )
          ) : communityPosts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {communityPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Rss}
              title="No feed posts yet"
              description={`${authorName} hasn't shared any feed posts yet.`}
              actionLabel="Explore Feed"
              actionHref="/feed"
            />
          )}
        </div>
      </div>
    </>
  );
}
