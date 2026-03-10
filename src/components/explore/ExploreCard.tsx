"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import {
  MessageCircle,
  Share2,
  Eye,
  Flag,
  EyeOff,
  Link2,
  Bell,
  UserPlus,
  Code,
  ExternalLink,
  MoreHorizontal,
} from "lucide-react";
import useMeasure from "react-use-measure";
import { BookmarkButton } from "@/components/common/BookmarkButton";
import { ReactionButton } from "@/components/explore/ReactionButton";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { ExplorePost } from "@/lib/api/explore";

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" });
}

const TYPE_COLORS: Record<string, string> = {
  NEWS: "bg-blue-500/20 text-blue-400",
  MUSIC: "bg-brand/20 text-brand",
  GIST: "bg-purple-500/20 text-purple-400",
  VIDEO: "bg-orange-500/20 text-orange-400",
  ALBUM: "bg-emerald-500/20 text-emerald-400",
  LYRICS: "bg-amber-500/20 text-amber-400",
};

// ── Options menu items (Facebook-style) ──
const OPTION_ITEMS = [
  { id: "save", label: "Save post", icon: Link2 },
  { id: "follow", label: "Follow author", icon: UserPlus },
  { id: "notifications", label: "Turn on notifications", icon: Bell },
  { id: "divider1", label: "", icon: null },
  { id: "embed", label: "Embed post", icon: Code },
  { id: "open", label: "Open in new tab", icon: ExternalLink },
  { id: "divider2", label: "", icon: null },
  { id: "hide", label: "Hide this post", icon: EyeOff },
  { id: "report", label: "Report post", icon: Flag },
];

const easeOutQuint: [number, number, number, number] = [0.23, 1, 0.32, 1];

// ── Smooth Options Dropdown (uselayout pattern) ──
function OptionsDropdown({ post }: { post: ExplorePost }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [contentRef, contentBounds] = useMeasure();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleItemClick = (id: string) => {
    switch (id) {
      case "save":
        toast.success("Post saved!");
        break;
      case "follow":
        toast.success(`Following ${post.author.name ?? "author"}`);
        break;
      case "notifications":
        toast.success("Notifications turned on");
        break;
      case "embed":
        navigator.clipboard
          .writeText(`<iframe src="${window.location.origin}${post.href}" />`)
          .then(() => toast.success("Embed code copied!"));
        break;
      case "open":
        window.open(post.href, "_blank");
        break;
      case "hide":
        toast.success("Post hidden from your feed");
        break;
      case "report":
        toast.success("Post reported. Thanks for helping keep the community safe.");
        break;
    }
    setIsOpen(false);
  };

  const openHeight = Math.max(44, Math.ceil(contentBounds.height));

  return (
    <div ref={containerRef} className="relative h-11 w-11" onClick={(e) => e.stopPropagation()}>
      <motion.div
        layout
        initial={false}
        animate={{
          width: isOpen ? 230 : 44,
          height: isOpen ? openHeight : 44,
          borderRadius: isOpen ? 14 : 22,
        }}
        transition={{
          type: "spring" as const,
          damping: 34,
          stiffness: 380,
          mass: 0.8,
        }}
        className="bg-popover/95 border-border absolute right-0 bottom-0 origin-bottom-right cursor-pointer overflow-hidden border shadow-xl backdrop-blur-md"
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
          <MoreHorizontal className="h-5 w-5 text-white" />
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
              {OPTION_ITEMS.map((item, index) => {
                if (item.id.startsWith("divider")) {
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

                const Icon = item.icon!;
                const isReport = item.id === "report";
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
                      isReport && isHovered
                        ? "text-red-500"
                        : isReport
                          ? "text-muted-foreground hover:text-red-500"
                          : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {isHovered && (
                      <motion.div
                        layoutId="explore-option-indicator"
                        className={cn(
                          "absolute inset-0 rounded-lg",
                          isReport ? "bg-red-500/10" : "bg-muted"
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
                        layoutId="explore-option-bar"
                        className={cn(
                          "absolute top-0 bottom-0 left-0 my-auto h-4 w-[3px] rounded-full",
                          isReport ? "bg-red-500" : "bg-foreground"
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
                    <span className="relative z-10 font-medium">{item.label}</span>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Author Hover Card (Facebook-style tooltip) ──
function AuthorHoverCard({ post }: { post: ExplorePost }) {
  return (
    <HoverCard openDelay={300} closeDelay={150}>
      <HoverCardTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="relative flex h-12 w-12 items-center justify-center rounded-full bg-black/40 ring-2 ring-white/20 backdrop-blur-sm transition-all hover:ring-white/40"
          aria-label={`View ${post.author.name ?? "author"} profile`}
        >
          {post.author.avatar ? (
            <Image
              src={post.author.avatar}
              alt={post.author.name ?? "Author"}
              width={44}
              height={44}
              className="rounded-full object-cover"
            />
          ) : (
            <span className="text-sm font-bold text-white">
              {post.author.name?.[0]?.toUpperCase() ?? "?"}
            </span>
          )}
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        side="left"
        align="center"
        sideOffset={12}
        className="bg-popover/95 w-72 rounded-xl border-none p-0 shadow-2xl backdrop-blur-md"
      >
        {/* Cover banner */}
        <div className="bg-brand/20 relative h-16 rounded-t-xl">
          <div className="absolute -bottom-6 left-4">
            {post.author.avatar ? (
              <Image
                src={post.author.avatar}
                alt={post.author.name ?? "Author"}
                width={48}
                height={48}
                className="ring-popover rounded-full object-cover ring-3"
              />
            ) : (
              <div className="ring-popover bg-brand flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white ring-3">
                {post.author.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
        </div>
        <div className="px-4 pt-8 pb-4">
          <h4 className="text-foreground text-sm font-bold">{post.author.name ?? "Author"}</h4>
          <p className="text-muted-foreground mt-0.5 text-xs">Content creator</p>

          <div className="mt-3 flex gap-4 text-xs">
            <div>
              <span className="text-foreground font-semibold">--</span>
              <span className="text-muted-foreground ml-1">Posts</span>
            </div>
            <div>
              <span className="text-foreground font-semibold">--</span>
              <span className="text-muted-foreground ml-1">Followers</span>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button className="bg-brand hover:bg-brand/90 flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors">
              Follow
            </button>
            <button className="bg-muted text-foreground hover:bg-muted/80 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors">
              Message
            </button>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

// ── Main ExploreCard ──
interface ExploreCardProps {
  post: ExplorePost;
}

export function ExploreCard({ post }: ExploreCardProps) {
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareData = {
      title: post.title,
      url: `${window.location.origin}${post.href}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled share
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.url);
        toast.success("Link copied!");
      } catch {
        toast.error("Could not copy link");
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-card/50 ring-border/40 group relative overflow-hidden rounded-2xl ring-1 backdrop-blur-sm"
    >
      {/* Clickable card overlay */}
      <Link href={post.href} className="absolute inset-0 z-0" aria-label={post.title} />

      {/* Cover image — full card is the image */}
      <div className="relative aspect-[9/16] overflow-hidden">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 480px"
          />
        ) : (
          <div className="bg-muted flex h-full items-center justify-center">
            <Eye className="text-muted-foreground/30 h-12 w-12" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />

        {/* ── Right-side floating actions (BIGGER) ── */}
        <div className="absolute top-3 right-3 bottom-3 z-10 flex flex-col items-center justify-end gap-1.5">
          {/* Author avatar with hover card */}
          <div className="mb-2">
            <AuthorHoverCard post={post} />
          </div>

          {/* Reaction (heart → emoji) */}
          <ReactionButton postId={post.id} reactionCount={post.reactionCount} />

          {/* Bookmark */}
          <div onClick={(e) => e.stopPropagation()}>
            <BookmarkButton
              postId={post.id}
              className="h-12 w-12 rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
              size="icon"
            />
          </div>

          {/* Comments */}
          <Link
            href={`${post.href}#comments`}
            onClick={(e) => e.stopPropagation()}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
            aria-label="Comments"
          >
            <MessageCircle className="h-5 w-5" />
          </Link>
          <span className="text-center text-[11px] font-semibold text-white/90">
            {formatCount(post.commentCount)}
          </span>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
            aria-label="Share"
          >
            <Share2 className="h-5 w-5" />
          </button>

          {/* Views */}
          <div className="flex h-12 w-12 flex-col items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm">
            <Eye className="h-5 w-5" />
          </div>
          <span className="text-center text-[11px] font-semibold text-white/90">
            {formatCount(post.views)}
          </span>

          {/* Options dropdown */}
          <OptionsDropdown post={post} />
        </div>

        {/* ── Bottom-left overlay: meta bar + content ── */}
        <div className="absolute right-20 bottom-0 left-0 z-[1] p-4">
          {/* Author meta */}
          <div className="mb-3 flex items-center gap-2.5">
            {post.author.avatar ? (
              <Image
                src={post.author.avatar}
                alt={post.author.name ?? "Author"}
                width={32}
                height={32}
                className="rounded-full ring-1 ring-white/30"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                {post.author.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold text-white">
                {post.author.name ?? "Author"}
              </span>
              <span className="text-[11px] text-white/60">{formatDate(post.publishedAt)}</span>
            </div>
          </div>

          {/* Pills */}
          <div className="flex items-center gap-2">
            {post.category && (
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                {post.category.name}
              </span>
            )}
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                TYPE_COLORS[post.type] ?? "bg-muted text-muted-foreground"
              )}
            >
              {post.type}
            </span>
          </div>

          {/* Title + excerpt */}
          <h3 className="mt-2 line-clamp-2 text-lg leading-tight font-bold text-white sm:text-xl">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-white/70">
              {post.excerpt}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
