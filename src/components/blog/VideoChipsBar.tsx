"use client";

import { cn } from "@/lib/utils";

interface VideoChipsBarProps {
  categories: { name: string; slug: string; postCount: number }[];
  selectedCategory: string | null;
  onCategoryChange: (slug: string | null) => void;
}

export function VideoChipsBar({
  categories,
  selectedCategory,
  onCategoryChange,
}: VideoChipsBarProps) {
  return (
    <div className="border-border/40 bg-background/95 sticky top-14 z-30 border-b backdrop-blur">
      <div className="scrollbar-hide flex gap-2 overflow-x-auto px-4 py-3 sm:px-6">
        {/* "All" chip */}
        <button
          type="button"
          onClick={() => onCategoryChange(null)}
          className={cn(
            "flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            selectedCategory === null
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          All
        </button>

        {categories.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            onClick={() => onCategoryChange(cat.slug)}
            className={cn(
              "flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
              selectedCategory === cat.slug
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
