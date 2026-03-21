"use client";

import { MoreVertical, Share2, Link2, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import toast from "react-hot-toast";

interface VideoCardMoreButtonProps {
  videoUrl: string;
  videoTitle: string;
}

export function VideoCardMoreButton({ videoUrl, videoTitle }: VideoCardMoreButtonProps) {
  const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${videoUrl}` : videoUrl;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: videoTitle, url: fullUrl });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(fullUrl);
      toast.success("Link copied to clipboard");
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(fullUrl);
    toast.success("Link copied to clipboard");
  };

  const handleWatchLater = () => {
    toast.success("Saved to Watch Later");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground hover:bg-muted -mr-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full opacity-0 transition-all group-hover:opacity-100"
          aria-label="More options"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleShare} className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink} className="gap-2">
          <Link2 className="h-4 w-4" />
          Copy link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleWatchLater} className="gap-2">
          <Clock className="h-4 w-4" />
          Save to Watch Later
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
