"use client";

import { usePlayerStore } from "@/store/player.store";
import { MusicLeftSidebar } from "./MusicLeftSidebar";
import { QueuePanel } from "./QueuePanel";
import { cn } from "@/lib/utils";

interface MusicPageLayoutProps {
  children: React.ReactNode;
  /** Optional right sidebar (e.g. MusicRightSidebar). Hidden when queue is open. */
  rightSidebar?: React.ReactNode;
}

export function MusicPageLayout({ children, rightSidebar }: MusicPageLayoutProps) {
  const isQueueOpen = usePlayerStore((s) => s.isQueueOpen);

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
      <div
        className={cn(
          "grid grid-cols-1 gap-6 py-5",
          isQueueOpen
            ? "lg:grid-cols-[1fr_300px] xl:grid-cols-[220px_1fr_300px]"
            : rightSidebar
              ? "lg:grid-cols-[1fr_300px] xl:grid-cols-[220px_1fr_300px]"
              : "xl:grid-cols-[220px_1fr]"
        )}
      >
        <MusicLeftSidebar />
        <main className="@container min-w-0">{children}</main>
        {isQueueOpen ? <QueuePanel /> : (rightSidebar ?? null)}
      </div>
    </div>
  );
}
