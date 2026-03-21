"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { MoreHorizontal, ListPlus, Share2, Download, User } from "lucide-react";
import useMeasure from "react-use-measure";
import { usePlayerStore } from "@/store/player.store";
import { notify } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import type { MusicCardData } from "@/lib/api/music";
import type { Track } from "@/store/player.store";
import type { LucideIcon } from "lucide-react";

interface MusicActionMenuProps {
  track: MusicCardData;
  size?: number;
  className?: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

function toPlayerTrack(t: MusicCardData): Track {
  return {
    id: t.id,
    title: t.title,
    artist: t.artistName,
    coverArt: t.coverArt ?? null,
    r2Key: "",
    duration: 0,
    slug: t.slug,
  };
}

const allMenuItems: MenuItem[] = [
  { id: "queue", label: "Add to Queue", icon: ListPlus },
  { id: "artist", label: "Go to Artist", icon: User },
  { id: "share", label: "Share", icon: Share2 },
  { id: "download", label: "Download", icon: Download },
];

const easeOutQuint: [number, number, number, number] = [0.23, 1, 0.32, 1];

/**
 * Exact uselayouts smooth-dropdown pattern, rendered via portal
 * so it escapes parent overflow containers (ScrollShelf, card art).
 */
export function MusicActionMenu({ track, size = 20, className }: MusicActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [anchor, setAnchor] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [contentRef, contentBounds] = useMeasure();
  const addToQueue = usePlayerStore((s) => s.addToQueue);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // Anchor so the dropdown's right edge aligns with trigger's right edge,
      // and it expands upward from the trigger's top
      setAnchor({
        top: rect.top + window.scrollY,
        left: rect.right + window.scrollX,
      });
      setPortalReady(true);
    }
    setIsOpen((prev) => !prev);
    setHoveredItem(null);
  };

  // Click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // Close on any scroll
  useEffect(() => {
    if (!isOpen) return;
    const handler = () => setIsOpen(false);
    window.addEventListener("scroll", handler, true);
    return () => window.removeEventListener("scroll", handler, true);
  }, [isOpen]);

  const handleAction = useCallback(
    (id: string) => {
      switch (id) {
        case "queue":
          addToQueue(toPlayerTrack(track));
          notify.success(`Added "${track.title}" to queue`);
          break;
        case "artist":
          window.location.href = `/artists?q=${encodeURIComponent(track.artistName)}`;
          break;
        case "share":
          if (navigator.share) {
            navigator
              .share({
                title: track.title,
                text: `Listen to ${track.title} by ${track.artistName}`,
                url: `${window.location.origin}/music/${track.slug}`,
              })
              .catch((err) => {
                if (err instanceof DOMException && err.name === "AbortError") return;
                notify.error("Failed to share");
              });
          } else {
            navigator.clipboard
              .writeText(`${window.location.origin}/music/${track.slug}`)
              .then(() => notify.success("Link copied!"))
              .catch(() => notify.error("Failed to copy link"));
          }
          break;
        case "download":
          if (track.enableDownload) {
            window.location.href = `/music/${track.slug}?download=true`;
          } else {
            notify.error("Download not available");
          }
          break;
      }
      setIsOpen(false);
    },
    [track, addToQueue]
  );

  const visibleItems = allMenuItems.filter(
    (item) => item.id !== "download" || track.enableDownload
  );

  const openHeight = Math.max(40, Math.ceil(contentBounds.height));

  return (
    <>
      {/* Trigger — stays in card flow */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className={cn(
          "flex items-center justify-center rounded-full transition-transform duration-150 active:scale-90",
          className
        )}
        aria-label="More options"
      >
        <MoreHorizontal size={size} className="text-white drop-shadow-md" />
      </button>

      {/* Portal: smooth-dropdown pattern, anchored at trigger's right edge */}
      {portalReady &&
        createPortal(
          <div
            ref={containerRef}
            className="absolute z-[9999]"
            style={{
              // Right edge of container = right edge of trigger
              // Dropdown grows leftward + upward from trigger
              top: anchor.top,
              left: anchor.left,
              width: 0,
              height: 0,
              pointerEvents: isOpen ? "auto" : "none",
            }}
          >
            <motion.div
              layout
              initial={false}
              animate={{
                width: isOpen ? 200 : 0,
                height: isOpen ? openHeight : 0,
                borderRadius: isOpen ? 14 : 12,
                opacity: isOpen ? 1 : 0,
              }}
              transition={{
                type: "spring" as const,
                damping: 34,
                stiffness: 380,
                mass: 0.8,
                opacity: { duration: 0.15 },
              }}
              className="bg-popover border-border absolute right-0 bottom-0 origin-bottom-right cursor-pointer overflow-hidden border shadow-lg"
              style={{ pointerEvents: isOpen ? "auto" : "none" }}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {/* Menu content — fades in */}
              <div ref={contentRef}>
                <motion.div
                  layout
                  initial={false}
                  animate={{ opacity: isOpen ? 1 : 0 }}
                  transition={{
                    duration: 0.2,
                    delay: isOpen ? 0.08 : 0,
                  }}
                  className="p-2"
                  style={{
                    pointerEvents: isOpen ? "auto" : "none",
                    willChange: "transform",
                  }}
                >
                  <div className="flex flex-col gap-0.5">
                    {visibleItems.map((item, index) => {
                      const Icon = item.icon;
                      const isHovered = hoveredItem === item.id;
                      const itemDelay = isOpen ? 0.06 + index * 0.02 : 0;

                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: 8 }}
                          animate={{
                            opacity: isOpen ? 1 : 0,
                            x: isOpen ? 0 : 8,
                          }}
                          transition={{
                            delay: itemDelay,
                            duration: 0.15,
                            ease: easeOutQuint,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(item.id);
                          }}
                          onMouseEnter={() => setHoveredItem(item.id)}
                          onMouseLeave={() => setHoveredItem(null)}
                          className="text-muted-foreground hover:text-foreground relative flex cursor-pointer items-center gap-3 rounded-lg py-2 pl-3 text-sm transition-colors duration-200 ease-out"
                        >
                          {/* Hover background indicator */}
                          {isHovered && (
                            <motion.div
                              layoutId={`menu-bg-${track.id}`}
                              className="bg-muted absolute inset-0 rounded-lg"
                              transition={{
                                type: "spring",
                                damping: 30,
                                stiffness: 520,
                                mass: 0.8,
                              }}
                            />
                          )}
                          {/* Left bar indicator */}
                          {isHovered && (
                            <motion.div
                              layoutId={`menu-bar-${track.id}`}
                              className="bg-foreground absolute top-0 bottom-0 left-0 my-auto h-5 w-[3px] rounded-full"
                              transition={{
                                type: "spring",
                                damping: 30,
                                stiffness: 520,
                                mass: 0.8,
                              }}
                            />
                          )}
                          <Icon size={18} className="relative z-10" />
                          <span className="relative z-10 font-medium">{item.label}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
    </>
  );
}
