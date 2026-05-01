"use client";

import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { useFavoriteCheck } from "@/hooks/useUserDashboard";
import { useToggleFavorite } from "@/hooks/useUserMutations";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ClientCreatorEventContext } from "@/lib/client/creator-events";

interface FavoriteButtonProps {
  postId?: string;
  musicId?: string;
  className?: string;
  size?: "sm" | "default" | "icon";
  source?: ClientCreatorEventContext;
}

export function FavoriteButton({
  postId,
  musicId,
  className,
  size = "icon",
  source,
}: FavoriteButtonProps) {
  const { status } = useSession();
  const { data: checkData } = useFavoriteCheck(postId, musicId);
  const toggleFavorite = useToggleFavorite();

  if (status !== "authenticated") {
    return (
      <Button
        variant="ghost"
        size={size}
        className={cn("text-muted-foreground", className)}
        asChild
      >
        <Link href="/login">
          <Heart className="h-4 w-4" />
        </Link>
      </Button>
    );
  }

  const isFavorited = checkData?.favorited ?? false;

  return (
    <Button
      variant="ghost"
      size={size}
      className={cn(
        isFavorited ? "text-red-500" : "text-muted-foreground hover:text-foreground",
        className
      )}
      onClick={() =>
        toggleFavorite.mutate({
          postId,
          musicId,
          favoriteId: checkData?.favoriteId,
          source,
        })
      }
      disabled={toggleFavorite.isPending}
    >
      <Heart className={cn("h-4 w-4", isFavorited && "fill-current")} />
    </Button>
  );
}
