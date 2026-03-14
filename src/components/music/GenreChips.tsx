"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface GenreChipsProps {
  genres: string[];
  onChange?: (genre: string | null) => void;
}

export function GenreChips({ genres, onChange }: GenreChipsProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleClick = (genre: string | null) => {
    setSelected(genre);
    onChange?.(genre);
  };

  return (
    <div className="scrollbar-hide flex gap-2 overflow-x-auto py-3">
      {/* "All" chip */}
      <button
        type="button"
        onClick={() => handleClick(null)}
        className={cn(
          "flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
          selected === null
            ? "bg-foreground text-background"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
      >
        All
      </button>

      {genres.map((genre) => (
        <button
          key={genre}
          type="button"
          onClick={() => handleClick(genre)}
          className={cn(
            "flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
            selected === genre
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {genre}
        </button>
      ))}
    </div>
  );
}
