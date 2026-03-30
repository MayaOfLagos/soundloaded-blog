"use client";

import { usePlayerStore } from "@/store/player.store";
import { QueuePanel } from "./QueuePanel";

/**
 * Renders the QueuePanel inside a page's grid as a right column.
 * Place this as the LAST child in any grid layout.
 * It only renders when the queue is open — the parent grid should
 * handle the column sizing conditionally.
 */
export function QueueSidebar() {
  const isQueueOpen = usePlayerStore((s) => s.isQueueOpen);
  if (!isQueueOpen) return null;
  return <QueuePanel />;
}
