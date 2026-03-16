"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface FeedTabsProps {
  activeTab: "foryou" | "following" | "discover";
  onChange: (tab: "foryou" | "following" | "discover") => void;
}

const TABS = [
  { key: "foryou" as const, label: "For You" },
  { key: "following" as const, label: "Following" },
  { key: "discover" as const, label: "Discover" },
] as const;

export function FeedTabs({ activeTab, onChange }: FeedTabsProps) {
  return (
    <div className="bg-card/50 ring-border/40 mb-4 flex items-center gap-1 rounded-xl p-1 ring-1 backdrop-blur-sm">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            "relative flex-1 rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors",
            activeTab === tab.key
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {activeTab === tab.key && (
            <motion.span
              layoutId="feed-tab-indicator"
              className="bg-muted absolute inset-0 rounded-lg"
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            />
          )}
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
