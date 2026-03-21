"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/ui.store";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const BP_FULL = "(min-width: 1313px)";

export function VideoSidebarToggle() {
  const isDesktopWide = useMediaQuery(BP_FULL);
  const togglePref = useUIStore((s) => s.toggleVideoSidebarPref);
  const openDrawer = useUIStore((s) => s.openVideoSidebarDrawer);

  const handleClick = () => {
    if (isDesktopWide) {
      togglePref();
    } else {
      openDrawer();
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className="h-9 w-9 rounded-full"
      aria-label="Toggle sidebar"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
