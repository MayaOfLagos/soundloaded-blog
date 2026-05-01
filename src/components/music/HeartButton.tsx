"use client";

import { useState, useCallback } from "react";
import { Heart } from "lucide-react";
import { useMusicFavorite } from "@/hooks/useMusicFavorite";
import { cn } from "@/lib/utils";
import type { ClientCreatorEventContext } from "@/lib/client/creator-events";

interface HeartButtonProps {
  musicId: string;
  size?: number;
  className?: string;
  source?: ClientCreatorEventContext;
}

export function HeartButton({ musicId, size = 20, className, source }: HeartButtonProps) {
  const { isFavorited, toggleFavorite } = useMusicFavorite(musicId, source);
  const [isBursting, setIsBursting] = useState(false);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!isFavorited) {
        setIsBursting(true);
      }

      toggleFavorite();
    },
    [isFavorited, toggleFavorite]
  );

  const handleAnimationEnd = useCallback(() => {
    setIsBursting(false);
  }, []);

  return (
    <button
      type="button"
      onClick={handleClick}
      onAnimationEnd={handleAnimationEnd}
      className={cn(
        "relative flex items-center justify-center rounded-full transition-transform duration-150 active:scale-90",
        isBursting && "heart-burst-active",
        className
      )}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        size={size}
        className={cn(
          "heart-icon transition-colors duration-200",
          isFavorited ? "fill-red-500 text-red-500" : "text-muted-foreground fill-transparent"
        )}
      />
    </button>
  );
}
