"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import {
  MoreHorizontal,
  Bookmark,
  BookmarkCheck,
  UserPlus,
  UserMinus,
  Code,
  // ExternalLink, // TODO: re-enable when dedicated post page exists
  EyeOff,
  Flag,
} from "lucide-react";
import useMeasure from "react-use-measure";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useBookmarkCheck } from "@/hooks/useUserDashboard";
import { useToggleBookmark } from "@/hooks/useUserMutations";
import { useFollowCheck, useToggleFollow } from "@/hooks/useFollow";
import { ReportDialog } from "@/components/feed/ReportDialog";
import { EmbedDialog } from "@/components/feed/EmbedDialog";

const easeOutQuint: [number, number, number, number] = [0.23, 1, 0.32, 1];

interface PostOptionsMenuProps {
  postId: string;
  authorId: string;
  postHref: string;
  authorName?: string | null;
  onHide?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  isDanger?: boolean;
  isDivider?: boolean;
}

export function PostOptionsMenu({
  postId,
  authorId,
  postHref,
  authorName,
  onHide,
}: PostOptionsMenuProps) {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [contentRef, contentBounds] = useMeasure();

  // ── Real hooks for save & follow ──
  const currentUserId = (session?.user as { id?: string })?.id;
  const isOwnPost = currentUserId === authorId;

  const { data: bookmarkData } = useBookmarkCheck(postId);
  const toggleBookmark = useToggleBookmark();
  const isSaved = bookmarkData?.bookmarked ?? false;

  const { data: followData } = useFollowCheck(isOwnPost ? undefined : authorId);
  const toggleFollow = useToggleFollow();
  const isFollowing = followData?.following ?? false;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Unauthenticated — redirect to login
  if (status !== "authenticated") {
    return (
      <Link
        href="/login"
        className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full p-1.5 transition-colors"
      >
        <MoreHorizontal className="h-5 w-5" />
      </Link>
    );
  }

  // ── Build menu items dynamically ──
  const items: MenuItem[] = [];

  // Save / Unsave
  items.push({
    id: "save",
    label: isSaved ? "Unsave post" : "Save post",
    icon: isSaved ? BookmarkCheck : Bookmark,
  });

  // Follow / Unfollow (only if NOT own post)
  if (!isOwnPost) {
    items.push({
      id: "follow",
      label: isFollowing
        ? `Unfollow ${authorName ?? "author"}`
        : `Follow ${authorName ?? "author"}`,
      icon: isFollowing ? UserMinus : UserPlus,
    });
  }

  // Divider
  items.push({ id: "divider1", label: "", icon: MoreHorizontal, isDivider: true });

  // Embed
  items.push({ id: "embed", label: "Embed post", icon: Code });

  // TODO: re-enable when dedicated post page exists
  // items.push({ id: "open", label: "Open in new tab", icon: ExternalLink });

  // Divider
  items.push({ id: "divider2", label: "", icon: MoreHorizontal, isDivider: true });

  // Hide (not on own posts)
  if (!isOwnPost) {
    items.push({ id: "hide", label: "Hide this post", icon: EyeOff });
  }

  // Report (not on own posts)
  if (!isOwnPost) {
    items.push({ id: "report", label: "Report post", icon: Flag, isDanger: true });
  }

  const handleItemClick = (id: string) => {
    switch (id) {
      case "save":
        toggleBookmark.mutate({
          postId,
          bookmarkId: bookmarkData?.bookmarkId,
        });
        break;
      case "follow":
        toggleFollow.mutate({ userId: authorId, isFollowing });
        break;
      case "embed":
        setEmbedOpen(true);
        break;
      case "hide":
        onHide?.();
        break;
      case "report":
        setReportOpen(true);
        break;
    }
    setIsOpen(false);
  };

  const openHeight = Math.max(36, Math.ceil(contentBounds.height));

  return (
    <>
      <div ref={containerRef} className="relative h-8 w-8" onClick={(e) => e.stopPropagation()}>
        <motion.div
          layout
          initial={false}
          animate={{
            width: isOpen ? 240 : 32,
            height: isOpen ? openHeight : 32,
            borderRadius: isOpen ? 14 : 16,
          }}
          transition={{
            type: "spring" as const,
            damping: 34,
            stiffness: 380,
            mass: 0.8,
          }}
          className="bg-popover/95 border-border absolute top-0 right-0 origin-top-right cursor-pointer overflow-hidden border shadow-xl backdrop-blur-md"
          style={{ zIndex: isOpen ? 50 : 1 }}
          onClick={() => !isOpen && setIsOpen(true)}
        >
          {/* Closed state — icon */}
          <motion.div
            initial={false}
            animate={{ opacity: isOpen ? 0 : 1, scale: isOpen ? 0.8 : 1 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex items-center justify-center"
            style={{ pointerEvents: isOpen ? "none" : "auto" }}
          >
            <MoreHorizontal className="text-muted-foreground h-4 w-4" />
          </motion.div>

          {/* Open state — menu */}
          <div ref={contentRef}>
            <motion.div
              layout
              initial={false}
              animate={{ opacity: isOpen ? 1 : 0 }}
              transition={{ duration: 0.2, delay: isOpen ? 0.08 : 0 }}
              className="p-1.5"
              style={{ pointerEvents: isOpen ? "auto" : "none" }}
            >
              <ul className="flex flex-col gap-0.5">
                {items.map((item, index) => {
                  if (item.isDivider) {
                    return (
                      <motion.hr
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isOpen ? 1 : 0 }}
                        transition={{ delay: isOpen ? 0.12 + index * 0.015 : 0 }}
                        className="border-border my-1"
                      />
                    );
                  }

                  const Icon = item.icon;
                  const isDanger = item.isDanger;
                  const isHovered = hoveredItem === item.id;

                  return (
                    <motion.li
                      key={item.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: isOpen ? 1 : 0, x: isOpen ? 0 : 8 }}
                      transition={{
                        delay: isOpen ? 0.06 + index * 0.02 : 0,
                        duration: 0.15,
                        ease: easeOutQuint,
                      }}
                      onClick={() => handleItemClick(item.id)}
                      onMouseEnter={() => setHoveredItem(item.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={cn(
                        "relative flex cursor-pointer list-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                        isDanger && isHovered
                          ? "text-red-500"
                          : isDanger
                            ? "text-muted-foreground hover:text-red-500"
                            : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {isHovered && (
                        <motion.div
                          layoutId="feed-option-indicator"
                          className={cn(
                            "absolute inset-0 rounded-lg",
                            isDanger ? "bg-red-500/10" : "bg-muted"
                          )}
                          transition={{
                            type: "spring",
                            damping: 30,
                            stiffness: 520,
                            mass: 0.8,
                          }}
                        />
                      )}
                      {isHovered && (
                        <motion.div
                          layoutId="feed-option-bar"
                          className={cn(
                            "absolute top-0 bottom-0 left-0 my-auto h-4 w-[3px] rounded-full",
                            isDanger ? "bg-red-500" : "bg-foreground"
                          )}
                          transition={{
                            type: "spring",
                            damping: 30,
                            stiffness: 520,
                            mass: 0.8,
                          }}
                        />
                      )}
                      <Icon className="relative z-10 h-4 w-4" />
                      <span className="relative z-10 truncate font-medium">{item.label}</span>
                    </motion.li>
                  );
                })}
              </ul>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Dialogs */}
      <ReportDialog postId={postId} open={reportOpen} onOpenChange={setReportOpen} />
      <EmbedDialog postHref={postHref} open={embedOpen} onOpenChange={setEmbedOpen} />
    </>
  );
}
