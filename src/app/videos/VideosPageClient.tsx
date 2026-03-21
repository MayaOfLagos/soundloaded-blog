"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useUIStore } from "@/store/ui.store";
import { VideoSidebar, type CategoryItem } from "@/components/blog/VideoSidebar";
import { VideoSidebarDrawer } from "@/components/blog/VideoSidebarDrawer";
import { VideoSidebarToggle } from "@/components/blog/VideoSidebarToggle";
import { VideoChipsBar } from "@/components/blog/VideoChipsBar";
import { cn } from "@/lib/utils";

// YouTube clone breakpoints
const BP_MINI = "(min-width: 792px)";
const BP_FULL = "(min-width: 1313px)";

type SidebarMode = "full" | "mini" | "hidden";

interface VideosPageClientProps {
  categories: CategoryItem[];
  children: React.ReactNode;
}

export function VideosPageClient({ categories, children }: VideosPageClientProps) {
  const isMinWidth = useMediaQuery(BP_MINI);
  const isFullWidth = useMediaQuery(BP_FULL);
  const userPrefFull = useUIStore((s) => s.videoSidebarPrefFull);

  // Derive sidebar mode
  let sidebarMode: SidebarMode = "hidden";
  if (isFullWidth && userPrefFull) sidebarMode = "full";
  else if (isMinWidth) sidebarMode = "mini";

  // Category chip state
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCategory = searchParams.get("category");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);

  const handleCategoryChange = (slug: string | null) => {
    setSelectedCategory(slug);
    const url = slug ? `/videos?category=${slug}` : "/videos";
    router.replace(url, { scroll: false });
  };

  // Margin class for main content based on sidebar mode
  const mainMarginClass =
    sidebarMode === "full" ? "ml-[240px]" : sidebarMode === "mini" ? "ml-[72px]" : "ml-0";

  return (
    <div className="relative min-h-screen">
      {/* Sidebar */}
      <VideoSidebar mode={sidebarMode} categories={categories} />
      <VideoSidebarDrawer categories={categories} />

      {/* Main content area */}
      <div className={cn("transition-[margin] duration-200 ease-out", mainMarginClass)}>
        {/* Toggle + Page title row */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-1 sm:px-6">
          <VideoSidebarToggle />
          <h1 className="text-foreground text-xl font-black sm:text-2xl">Videos</h1>
        </div>

        {/* Chips Bar */}
        <VideoChipsBar
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />

        {/* Hero + Grid (server-rendered children) */}
        <div className="px-4 py-4 sm:px-6">{children}</div>
      </div>
    </div>
  );
}
