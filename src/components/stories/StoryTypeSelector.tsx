"use client";

import { motion } from "motion/react";
import { Camera, Video, Type } from "lucide-react";

export type StoryType = "photo" | "video" | "text";

interface StoryTypeSelectorProps {
  onSelect: (type: StoryType) => void;
}

const TYPES = [
  { type: "photo" as const, icon: Camera, label: "Photo", color: "from-pink-500 to-rose-500" },
  { type: "video" as const, icon: Video, label: "Video", color: "from-violet-500 to-purple-500" },
  { type: "text" as const, icon: Type, label: "Text", color: "from-blue-500 to-cyan-500" },
];

export function StoryTypeSelector({ onSelect }: StoryTypeSelectorProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <h3 className="text-foreground mb-6 text-lg font-bold">Create Story</h3>
      <div className="grid w-full max-w-xs grid-cols-3 gap-4">
        {TYPES.map((item, i) => (
          <motion.button
            key={item.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, type: "spring", damping: 20 }}
            onClick={() => onSelect(item.type)}
            className="group flex flex-col items-center gap-3"
          >
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-white shadow-lg transition-transform group-hover:scale-105 group-active:scale-95`}
            >
              <item.icon className="h-8 w-8" />
            </div>
            <span className="text-foreground text-sm font-semibold">{item.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
