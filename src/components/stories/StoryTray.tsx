"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Plus, ChevronRight } from "lucide-react";
import { useStories } from "@/hooks/useStories";
import { StoryTraySkeleton } from "./StoryTraySkeleton";
import { StoryViewer } from "./StoryViewer";
import { StoriesDialog } from "./StoriesDialog";
import { StoryCreateDialog } from "./StoryCreateDialog";
import { cn } from "@/lib/utils";
import "./stories.css";

const MAX_VISIBLE = 10;

interface StoryTrayProps {
  className?: string;
}

export function StoryTray({ className }: StoryTrayProps) {
  const { status } = useSession();
  const { data: storyGroups, isLoading } = useStories();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  if (isLoading) return <StoryTraySkeleton />;

  const groups = storyGroups ?? [];
  const visibleGroups = groups.slice(0, MAX_VISIBLE);
  const hasMore = groups.length > MAX_VISIBLE;

  return (
    <>
      <div className={cn("scrollbar-hide flex items-start gap-3 overflow-x-auto py-2", className)}>
        {/* Your Story button */}
        {status === "authenticated" ? (
          <button
            onClick={() => setCreateOpen(true)}
            className="flex flex-col items-center gap-1.5"
          >
            <div className="from-brand/20 to-brand/5 ring-brand/30 relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ring-2">
              <div className="bg-brand flex h-6 w-6 items-center justify-center rounded-full">
                <Plus className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
            <span className="text-muted-foreground text-[10px] font-medium">Your Story</span>
          </button>
        ) : (
          <Link href="/login" className="flex flex-col items-center gap-1.5">
            <div className="bg-muted ring-border relative flex h-16 w-16 items-center justify-center rounded-full ring-2">
              <div className="bg-brand flex h-6 w-6 items-center justify-center rounded-full">
                <Plus className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
            <span className="text-muted-foreground text-[10px] font-medium">Your Story</span>
          </Link>
        )}

        {/* Story circles */}
        {visibleGroups.map((group, i) => (
          <button
            key={group.author.id}
            onClick={() => setViewerIndex(i)}
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

        {/* View All button */}
        {(hasMore || groups.length > 0) && (
          <button
            onClick={() => setDialogOpen(true)}
            className="flex flex-col items-center gap-1.5"
          >
            <div className="bg-muted ring-border hover:bg-muted/80 flex h-16 w-16 items-center justify-center rounded-full ring-2 transition-colors">
              <ChevronRight className="text-muted-foreground h-5 w-5" />
            </div>
            <span className="text-muted-foreground text-[10px] font-medium">View All</span>
          </button>
        )}
      </div>

      {/* Story viewer */}
      {viewerIndex !== null && (
        <StoryViewer
          storyGroups={visibleGroups}
          initialGroupIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}

      {/* Stories dialog (View All) */}
      <StoriesDialog open={dialogOpen} onOpenChange={setDialogOpen} storyGroups={groups} />

      {/* Story creation dialog */}
      <StoryCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
