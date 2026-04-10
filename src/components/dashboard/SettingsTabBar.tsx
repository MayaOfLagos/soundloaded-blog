"use client";

import { motion } from "motion/react";
import { User, Shield, Bell, Eye, Palette, Download, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const snappySpring = {
  type: "spring" as const,
  stiffness: 350,
  damping: 30,
  mass: 1,
};

const SETTINGS_TABS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: Eye },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "data", label: "Data", icon: Download },
];

interface SettingsTabBarProps {
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function SettingsTabBar({ activeTab, onTabChange }: SettingsTabBarProps) {
  return (
    <div className="scrollbar-hide -mx-1 overflow-x-auto px-1">
      <div className="bg-muted border-border flex w-fit rounded-full border p-1">
        {SETTINGS_TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                "relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all outline-none",
                isActive ? "text-brand-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="settings-active-tab"
                  className="bg-brand absolute inset-0 rounded-full shadow-md"
                  transition={snappySpring}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon
                  className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    isActive && "scale-110"
                  )}
                />
                <span className="hidden sm:inline">{label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { SETTINGS_TABS };
