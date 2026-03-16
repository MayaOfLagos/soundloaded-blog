"use client";

import { useState, useRef, useEffect, useCallback, createContext, useContext } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  MessageCircle,
  Share2,
  Eye,
  Flag,
  EyeOff,
  Link2,
  UserPlus,
  Code,
  ExternalLink,
  MoreHorizontal,
  Volume2,
  VolumeX,
  Play,
  Pause,
} from "lucide-react";
import useMeasure from "react-use-measure";
import { useSession } from "next-auth/react";
import { ExploreCommentSheet } from "@/components/explore/ExploreCommentSheet";
import { BookmarkButton } from "@/components/common/BookmarkButton";
import { ReactionButton } from "@/components/explore/ReactionButton";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { useToggleBookmark } from "@/hooks/useUserMutations";
import { useBookmarkCheck } from "@/hooks/useUserDashboard";
import { useFollowCheck, useToggleFollow } from "@/hooks/useFollow";
import { useToggleHiddenPost, useHiddenPostCheck } from "@/hooks/useHiddenPosts";
import { useFileReport } from "@/hooks/useReports";
import { usePostView } from "@/hooks/usePostView";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { ExplorePost } from "@/lib/api/explore";

// ── Global mute state shared across all video cards ──
const MuteContext = createContext<{
  muted: boolean;
  setMuted: (muted: boolean) => void;
}>({ muted: true, setMuted: () => {} });

export function VideoMuteProvider({ children }: { children: React.ReactNode }) {
  const [muted, setMuted] = useState(true);
  return <MuteContext.Provider value={{ muted, setMuted }}>{children}</MuteContext.Provider>;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for non-secure contexts (mobile HTTP, iframe, etc.)
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}

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

const REPORT_REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "misinformation", label: "Misinformation" },
  { value: "hate_speech", label: "Hate speech" },
  { value: "violence", label: "Violence" },
  { value: "other", label: "Other" },
];

const easeOutQuint: [number, number, number, number] = [0.23, 1, 0.32, 1];

function OptionsDropdown({ post }: { post: ExplorePost }) {
  const router = useRouter();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showReportMenu, setShowReportMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [contentRef, contentBounds] = useMeasure();

  // Hooks for real functionality
  const { data: bookmarkData } = useBookmarkCheck(post.id);
  const toggleBookmark = useToggleBookmark();
  const { data: followData } = useFollowCheck(post.author.id);
  const toggleFollow = useToggleFollow();
  const { data: hiddenData } = useHiddenPostCheck(post.id);
  const toggleHidden = useToggleHiddenPost();
  const fileReport = useFileReport();

  const isBookmarked = bookmarkData?.bookmarked ?? false;
  const isFollowing = followData?.following ?? false;
  const isHidden = hiddenData?.hidden ?? false;

  // Dynamic menu items based on state
  const optionItems = [
    { id: "save", label: isBookmarked ? "Unsave post" : "Save post", icon: Link2 },
    { id: "share", label: "Share post", icon: Share2 },
    { id: "follow", label: isFollowing ? "Unfollow author" : "Follow author", icon: UserPlus },
    { id: "divider1", label: "", icon: null },
    { id: "embed", label: "Embed post", icon: Code },
    { id: "open", label: "Open in new tab", icon: ExternalLink },
    { id: "divider2", label: "", icon: null },
    { id: "hide", label: isHidden ? "Unhide this post" : "Hide this post", icon: EyeOff },
    { id: "report", label: "Report post", icon: Flag },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowReportMenu(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleItemClick = (id: string) => {
    if (!isAuthenticated && ["save", "follow", "hide", "report"].includes(id)) {
      router.push("/login");
      return;
    }

    switch (id) {
      case "save":
        toggleBookmark.mutate({
          postId: post.id,
          bookmarkId: isBookmarked ? bookmarkData?.bookmarkId : undefined,
        });
        break;
      case "follow":
        toggleFollow.mutate({ userId: post.author.id, isFollowing });
        break;
      case "share": {
        const shareUrl = `${window.location.origin}${post.href}`;
        if (navigator.share) {
          navigator.share({ title: post.title, url: shareUrl }).catch(() => {});
        } else {
          copyToClipboard(shareUrl).then((ok) => {
            if (ok) toast.success("Link copied!");
            else toast.error("Could not copy link");
          });
        }
        break;
      }
      case "embed":
        copyToClipboard(`<iframe src="${window.location.origin}${post.href}" />`).then((ok) => {
          if (ok) toast.success("Embed code copied!");
          else toast.error("Could not copy code");
        });
        break;
      case "open":
        window.open(post.href, "_blank");
        break;
      case "hide":
        toggleHidden.mutate({ postId: post.id, isHidden });
        break;
      case "report":
        setShowReportMenu(true);
        return; // don't close menu
    }
    setIsOpen(false);
    setShowReportMenu(false);
  };

  const handleReport = (reason: string) => {
    fileReport.mutate({ postId: post.id, reason });
    setIsOpen(false);
    setShowReportMenu(false);
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
        className={cn(
          "absolute right-0 bottom-0 origin-bottom-right cursor-pointer overflow-hidden border shadow-xl backdrop-blur-md",
          isOpen ? "bg-popover/95 border-border" : "border-transparent bg-black/40"
        )}
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
            {showReportMenu ? (
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => setShowReportMenu(false)}
                  className="text-muted-foreground hover:text-foreground mb-1 flex items-center gap-1.5 px-2 py-1 text-xs font-medium"
                >
                  ← Back
                </button>
                <p className="text-foreground px-2.5 pb-1 text-xs font-semibold">
                  Why are you reporting?
                </p>
                {REPORT_REASONS.map((reason) => (
                  <button
                    key={reason.value}
                    type="button"
                    onClick={() => handleReport(reason.value)}
                    disabled={fileReport.isPending}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted w-full rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors"
                  >
                    {reason.label}
                  </button>
                ))}
              </div>
            ) : (
              <ul className="flex flex-col gap-0.5">
                {optionItems.map((item, index) => {
                  if (item.id.startsWith("divider")) {
                    return (
                      <li key={item.id} className="list-none" aria-hidden>
                        <motion.hr
                          initial={{ opacity: 0 }}
                          animate={{ opacity: isOpen ? 1 : 0 }}
                          transition={{ delay: isOpen ? 0.12 + index * 0.015 : 0 }}
                          className="border-border my-1"
                        />
                      </li>
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
            )}
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
          type="button"
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
            <button
              type="button"
              className="bg-brand hover:bg-brand/90 flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors"
            >
              Follow
            </button>
            <button
              type="button"
              className="bg-muted text-foreground hover:bg-muted/80 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
            >
              Message
            </button>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

function PostCoverMedia({ post }: { post: ExplorePost }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { muted, setMuted } = useContext(MuteContext);
  const [manualPause, setManualPause] = useState(false);
  const [visible, setVisible] = useState(false);

  const videoAttachment = post.mediaAttachments.find(
    (m) => m.type === "VIDEO" || m.mimeType.startsWith("video/")
  );

  // Auto play/pause based on viewport visibility
  useEffect(() => {
    if (!videoAttachment) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.5,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [videoAttachment]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (visible && !manualPause) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [visible, manualPause]);

  const togglePlay = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const video = videoRef.current;
      if (!video) return;
      if (manualPause) {
        video.play().catch(() => {});
        setManualPause(false);
      } else {
        video.pause();
        setManualPause(true);
      }
    },
    [manualPause]
  );

  const toggleMute = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setMuted(!muted);
    },
    [muted, setMuted]
  );

  if (videoAttachment) {
    const showPaused = manualPause || !visible;
    return (
      <div ref={containerRef} className="h-full w-full">
        <video
          ref={videoRef}
          src={videoAttachment.url}
          loop
          muted={muted}
          playsInline
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 z-20 flex gap-2 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
          <button
            type="button"
            onClick={togglePlay}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
            aria-label={showPaused ? "Play" : "Pause"}
          >
            {showPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={toggleMute}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    );
  }

  if (post.coverImage) {
    return (
      <Image
        src={post.coverImage}
        alt={post.title}
        fill
        className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, 576px"
      />
    );
  }

  return (
    <div className="bg-muted flex h-full items-center justify-center">
      <Eye className="text-muted-foreground/30 h-12 w-12" />
    </div>
  );
}

// ── Main ExploreCard ──
interface ExploreCardProps {
  post: ExplorePost;
}

export function ExploreCard({ post }: ExploreCardProps) {
  const [commentSheetOpen, setCommentSheetOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Facebook-style view tracking: 1s for images, 3s for video
  const hasVideo = post.mediaAttachments.some(
    (m) => m.type === "VIDEO" || m.mimeType.startsWith("video/")
  );
  usePostView(post.id, cardRef, { isVideo: hasVideo });

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-card/50 ring-border/40 group relative overflow-hidden rounded-2xl ring-1 backdrop-blur-sm select-none"
      style={{ WebkitTouchCallout: "none" }}
    >
      {/* Clickable card overlay — no link for user-generated posts */}
      {post.href ? (
        <Link href={post.href} className="absolute inset-0 z-0" aria-label={post.title} />
      ) : (
        <div className="absolute inset-0 z-0" />
      )}

      {/* Cover media */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <PostCoverMedia post={post} />

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
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setCommentSheetOpen(true);
            }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
            aria-label="Comments"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
          <span className="text-center text-[11px] font-semibold text-white/90">
            {formatCount(post.commentCount)}
          </span>

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

      {/* Comment sheet */}
      <ExploreCommentSheet
        postId={post.id}
        open={commentSheetOpen}
        onOpenChange={setCommentSheetOpen}
      />
    </motion.div>
  );
}
