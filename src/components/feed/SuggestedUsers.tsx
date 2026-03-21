"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Loader2, UserPlus } from "lucide-react";
import { useFollowCheck, useToggleFollow } from "@/hooks/useFollow";
import { FollowDialog } from "./FollowDialog";
import { cn } from "@/lib/utils";

export interface SuggestedUser {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  bio: string | null;
  followerCount: number;
  postCount: number;
}

function FollowButton({ userId }: { userId: string }) {
  const { data, isLoading } = useFollowCheck(userId);
  const toggleFollow = useToggleFollow();
  const isFollowing = data?.following ?? false;

  if (isLoading) {
    return (
      <span className="bg-muted shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold text-transparent">
        Follow
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggleFollow.mutate({ userId, isFollowing })}
      disabled={toggleFollow.isPending}
      className={cn(
        "shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition-colors",
        isFollowing
          ? "bg-muted text-foreground hover:bg-muted/80"
          : "bg-brand/10 text-brand hover:bg-brand/20"
      )}
    >
      {toggleFollow.isPending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : isFollowing ? (
        "Following"
      ) : (
        "Follow"
      )}
    </button>
  );
}

interface SuggestedUsersProps {
  initialUsers: SuggestedUser[];
}

export function SuggestedUsers({ initialUsers }: SuggestedUsersProps) {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!initialUsers || initialUsers.length === 0) return null;

  const visible = initialUsers.slice(0, 5);

  return (
    <>
      <div className="bg-card/50 ring-border/40 rounded-2xl p-4 ring-1 backdrop-blur-sm">
        <h3 className="text-foreground mb-3 text-sm font-bold">Suggested for you</h3>
        <div className="space-y-3">
          {visible.map((user) => (
            <div key={user.id} className="flex items-center gap-3">
              <Link
                href={user.username ? `/author/${user.username}` : "#"}
                className="bg-muted flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full"
              >
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name || ""}
                    width={36}
                    height={36}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-muted-foreground text-xs font-semibold">
                    {user.name?.charAt(0)?.toUpperCase()}
                  </span>
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={user.username ? `/author/${user.username}` : "#"}
                  className="text-foreground hover:text-brand block truncate text-[13px] font-semibold transition-colors"
                >
                  {user.name}
                </Link>
                <p className="text-muted-foreground text-[11px]">
                  {user.postCount} posts · {user.followerCount} followers
                </p>
              </div>
              {isAuthenticated ? (
                <FollowButton userId={user.id} />
              ) : (
                <Link
                  href="/login"
                  className="bg-brand/10 text-brand hover:bg-brand/20 shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition-colors"
                >
                  Follow
                </Link>
              )}
            </div>
          ))}
        </div>

        {isAuthenticated && (
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="text-brand hover:text-brand/80 mt-3 flex w-full items-center justify-center gap-1 text-xs font-semibold transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5" />
            See more
          </button>
        )}
      </div>

      {isAuthenticated && <FollowDialog open={dialogOpen} onOpenChange={setDialogOpen} />}
    </>
  );
}
