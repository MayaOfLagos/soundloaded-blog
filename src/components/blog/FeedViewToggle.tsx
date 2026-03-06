"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostCard, type PostCardData } from "./PostCard";

type ViewMode = "grid" | "list";

const STORAGE_KEY = "soundloaded:feed-view";

interface FeedViewToggleProps {
  posts: PostCardData[];
}

export function FeedViewToggle({ posts }: FeedViewToggleProps) {
  const [view, setView] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ViewMode | null;
      if (saved === "grid" || saved === "list") return saved;
    } catch {
      /* SSR fallback */
    }
    return "grid";
  });

  const toggle = (mode: ViewMode) => {
    setView(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  };

  return (
    <div>
      {/* Section header with view toggle */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-foreground text-lg font-extrabold tracking-tight">Latest Stories</h2>
        <div className="flex items-center gap-2">
          <div className="border-border flex rounded-lg border">
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-r-none ${view === "grid" ? "bg-muted text-foreground" : "text-muted-foreground"}`}
              onClick={() => toggle("grid")}
              title="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-l-none ${view === "list" ? "bg-muted text-foreground" : "text-muted-foreground"}`}
              onClick={() => toggle("list")}
              title="List view"
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Link
            href="/news"
            className="bg-muted text-muted-foreground hover:bg-brand/10 hover:text-brand rounded-full px-3 py-1 text-xs font-semibold transition-colors"
          >
            View all
          </Link>
        </div>
      </div>

      {/* Posts */}
      {view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="divide-border divide-y">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} variant="compact" />
          ))}
        </div>
      )}
    </div>
  );
}
