"use client";

import { Bookmark } from "lucide-react";
import { useSession } from "next-auth/react";
import { useBookmarkCheck } from "@/hooks/useUserDashboard";
import { useToggleBookmark } from "@/hooks/useUserMutations";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ClientCreatorEventContext } from "@/lib/client/creator-events";

interface BookmarkButtonProps {
  postId?: string;
  musicId?: string;
  className?: string;
  size?: "sm" | "default" | "icon";
  source?: ClientCreatorEventContext;
}

export function BookmarkButton({
  postId,
  musicId,
  className,
  size = "icon",
  source,
}: BookmarkButtonProps) {
  const { status } = useSession();
  const { data: checkData } = useBookmarkCheck(postId, musicId);
  const toggleBookmark = useToggleBookmark();

  if (status !== "authenticated") {
    return (
      <Button
        variant="ghost"
        size={size}
        className={cn("text-muted-foreground", className)}
        asChild
      >
        <Link href="/login">
          <Bookmark className="h-4 w-4" />
        </Link>
      </Button>
    );
  }

  const isBookmarked = checkData?.bookmarked ?? false;

  return (
    <Button
      variant="ghost"
      size={size}
      className={cn(
        isBookmarked ? "text-brand" : "text-muted-foreground hover:text-foreground",
        className
      )}
      onClick={() =>
        toggleBookmark.mutate({
          postId,
          musicId,
          bookmarkId: checkData?.bookmarkId,
          source,
        })
      }
      disabled={toggleBookmark.isPending}
    >
      <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
    </Button>
  );
}
