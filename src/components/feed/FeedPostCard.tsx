"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import NextLink from "next/link";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import {
  MessageCircle,
  Share2,
  Eye,
  Music,
  CheckCircle2,
  Undo2,
  UserMinus,
  Flag,
  X,
  ZoomIn,
  ZoomOut,
  Download,
  Maximize,
  ChevronLeft,
  ChevronRight,
  Globe,
} from "lucide-react";
import { motion } from "motion/react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { FeedReactionButton } from "@/components/feed/FeedReactionButton";
import { PostOptionsMenu } from "@/components/feed/PostOptionsMenu";
import { useToggleHiddenPost } from "@/hooks/useHiddenPosts";
import { useToggleFollow, useFollowCheck } from "@/hooks/useFollow";
import { FeedCommentDrawer } from "@/components/feed/FeedCommentDrawer";
import { ShareSheet } from "@/components/feed/ShareSheet";
import type { FeedPost } from "@/lib/api/feed";

type HideState = "visible" | "hiding" | "hidden";

interface FeedPostCardProps {
  post: FeedPost;
}

export function FeedPostCard({ post }: FeedPostCardProps) {
  const { data: session, status } = useSession();
  const [hideState, setHideState] = useState<HideState>("visible");
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [commentDrawerOpen, setCommentDrawerOpen] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toggleHiddenPost = useToggleHiddenPost();
  const toggleFollow = useToggleFollow();

  const isOwnPost = session?.user?.id === post.author.id;
  const { data: followData } = useFollowCheck(isOwnPost ? undefined : post.author.id);
  const isFollowing = followData?.following ?? false;

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const handleHide = useCallback(() => {
    setHideState("hiding");
    // Start 5s timer, then actually hide
    hideTimerRef.current = setTimeout(() => {
      toggleHiddenPost.mutate({ postId: post.id, isHidden: false });
      setHideState("hidden");
    }, 5000);
  }, [post.id, toggleHiddenPost]);

  const handleUndo = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setHideState("visible");
  }, []);

  const handleUnfollow = useCallback(() => {
    toggleFollow.mutate({
      userId: post.author.id,
      isFollowing: true,
    });
  }, [post.author, toggleFollow]);

  const timeAgo = post.publishedAt
    ? formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })
    : formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  const media = (post.mediaAttachments || []) as Array<{
    url: string;
    key: string;
    type: "IMAGE" | "VIDEO" | "AUDIO";
    mimeType: string;
  }>;

  const images = media.filter((m) => m.type === "IMAGE");
  const videos = media.filter((m) => m.type === "VIDEO");
  const audios = media.filter((m) => m.type === "AUDIO");

  // Extract text from TipTap body for display
  const bodyText = extractBodyText(post.body);

  const postHref = post.isUserGenerated ? `/feed#${post.id}` : `/${post.slug}`;

  // ── Hidden state — collapsed card is gone ──
  if (hideState === "hidden") return null;

  // ── Hiding state — compact FB-style undo card ──
  if (hideState === "hiding") {
    return (
      <motion.div
        initial={{ opacity: 1, height: "auto" }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, height: 0 }}
        className="border-border bg-card overflow-hidden border-[0.5px] max-sm:rounded-none max-sm:border-x-0 sm:rounded-xl"
      >
        <div className="flex items-start gap-3 p-4">
          <CheckCircle2 className="text-brand mt-0.5 h-5 w-5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-foreground text-sm font-semibold">Post hidden</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Hiding posts helps Soundloaded personalise your Feed.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={handleUndo}
                className="text-brand hover:text-brand/80 flex items-center gap-1.5 text-xs font-semibold transition-colors"
              >
                <Undo2 className="h-3.5 w-3.5" />
                Undo
              </button>
              <span className="text-border">·</span>
              <button
                onClick={handleUnfollow}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs font-medium transition-colors"
              >
                <UserMinus className="h-3.5 w-3.5" />
                Unfollow {post.author.name ?? "author"}
              </button>
              <span className="text-border">·</span>
              <button
                onClick={() => {
                  /* report dialog is on PostOptionsMenu, surface undo first */
                  toast("You can report posts from the ⋯ menu.", { icon: "🛡️" });
                }}
                className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-red-500"
              >
                <Flag className="h-3.5 w-3.5" />
                Report post
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="border-border bg-card overflow-hidden border-[0.5px] max-sm:rounded-none max-sm:border-x-0 sm:rounded-xl"
    >
      {/* ── Header ── */}
      <div className="flex items-start gap-2 px-4 pt-3 pb-2">
        {/* Avatar with story ring */}
        <div className="border-brand flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border-2 p-[1px]">
          <div className="bg-muted flex h-full w-full items-center justify-center overflow-hidden rounded-full">
            {post.author.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.author.image}
                alt={post.author.name || ""}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-muted-foreground text-[13px] font-semibold">
                {post.author.name?.charAt(0)?.toUpperCase() || "?"}
              </span>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {post.author.username ? (
              <NextLink
                href={`/author/${post.author.username}`}
                className="text-foreground truncate text-[15px] leading-tight font-semibold hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {post.author.name || "Anonymous"}
              </NextLink>
            ) : (
              <span className="text-foreground truncate text-[15px] leading-tight font-semibold">
                {post.author.name || "Anonymous"}
              </span>
            )}
            {!isOwnPost && !isFollowing && status === "authenticated" && (
              <>
                <span className="text-muted-foreground text-[15px]">·</span>
                <button
                  type="button"
                  onClick={() =>
                    toggleFollow.mutate({ userId: post.author.id, isFollowing: false })
                  }
                  className="text-brand text-[13px] font-semibold hover:underline"
                >
                  Follow
                </button>
              </>
            )}
          </div>
          <div className="text-muted-foreground mt-0.5 flex items-center gap-1 text-[13px]">
            <span className="cursor-pointer hover:underline">{timeAgo}</span>
            {post.category && (
              <>
                <span>·</span>
                <NextLink
                  href={`/${post.category.slug}`}
                  className="hover:text-brand transition-colors"
                >
                  {post.category.name}
                </NextLink>
              </>
            )}
            <span>·</span>
            <Globe className="h-3 w-3" />
          </div>
        </div>

        {/* Header action buttons */}
        <div className="ml-auto flex shrink-0 items-center gap-0.5 pl-2">
          <PostOptionsMenu
            postId={post.id}
            authorId={post.author.id}
            postHref={postHref}
            authorName={post.author.name}
            onHide={handleHide}
          />
          <button
            type="button"
            onClick={handleHide}
            className="text-muted-foreground hover:bg-muted flex h-9 w-9 items-center justify-center rounded-full transition-colors"
            aria-label="Hide post"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Body text ── */}
      {bodyText && <PostBody text={bodyText} />}

      {/* ── Media grid ── */}
      {images.length > 0 && (
        <div
          className={cn(
            "mt-1 grid gap-0.5",
            images.length === 1 && "grid-cols-1",
            images.length === 2 && "grid-cols-2",
            images.length >= 3 && "grid-cols-2"
          )}
        >
          {images.slice(0, 4).map((img, i) => (
            <div
              key={img.key}
              className={cn(
                "relative cursor-pointer overflow-hidden bg-black select-none",
                images.length === 1 && "aspect-[4/5]",
                images.length === 2 && "aspect-[4/5]",
                images.length >= 3 && i === 0 && "row-span-2 aspect-[3/4]",
                images.length >= 3 && i > 0 && "aspect-[3/4]"
              )}
              style={{
                backgroundImage: `url(${img.url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
              onClick={() => setPreviewIndex(i)}
              onContextMenu={(e) => e.preventDefault()}
              draggable={false}
            >
              {/* Transparent overlay to block drag/save */}
              <div className="absolute inset-0" />
              {/* View count on last visible image (bottom-right) */}
              {i === Math.min(images.length, 4) - 1 && post.views > 0 && (
                <div className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                  <Eye className="h-3 w-3" />
                  {post.views}
                </div>
              )}
              {images.length > 4 && i === 3 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span className="text-2xl font-bold text-white">+{images.length - 4}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Video attachments */}
      {videos.length > 0 && images.length === 0 && (
        <div className="mt-1">
          {videos.slice(0, 1).map((vid) => (
            <div key={vid.key} className="relative max-h-[80vh] overflow-hidden bg-black">
              <video src={vid.url} className="w-full object-contain" controls preload="metadata" />
            </div>
          ))}
        </div>
      )}

      {/* Audio attachments */}
      {audios.length > 0 && images.length === 0 && videos.length === 0 && (
        <div className="mx-4 mt-1 mb-2 space-y-2">
          {audios.map((aud) => (
            <div
              key={aud.key}
              className="bg-muted/50 ring-border/30 flex items-center gap-3 rounded-xl p-3 ring-1"
            >
              <div className="bg-brand/10 flex h-10 w-10 items-center justify-center rounded-lg">
                <Music className="text-brand h-5 w-5" />
              </div>
              <audio src={aud.url} controls className="h-8 flex-1" preload="metadata" />
            </div>
          ))}
        </div>
      )}

      {/* ── Reactions bar ── */}
      {(post.reactionCount > 0 || post.commentCount > 0) && (
        <div className="flex items-center justify-between px-4 py-1.5">
          {/* Left: stacked emoji icons + count */}
          {post.reactionCount > 0 && (
            <div className="flex cursor-pointer items-center">
              <div className="flex items-center">
                {["❤️", "😂", "🔥"].slice(0, Math.min(3, post.reactionCount)).map((emoji, i) => (
                  <span
                    key={i}
                    className={cn(
                      "border-card bg-muted flex h-[18px] w-[18px] items-center justify-center rounded-full border-[1.5px] text-[10px]",
                      i > 0 && "-ml-[3px]",
                      i === 0 && "z-30",
                      i === 1 && "z-20",
                      i === 2 && "z-10"
                    )}
                  >
                    {emoji}
                  </span>
                ))}
              </div>
              <span className="text-muted-foreground ml-2 text-[15px] hover:underline">
                {post.reactionCount}
              </span>
            </div>
          )}
          {/* Right: comment count */}
          {post.commentCount > 0 && (
            <button
              type="button"
              onClick={() => setCommentDrawerOpen(true)}
              className="text-muted-foreground ml-auto cursor-pointer text-[15px] hover:underline"
            >
              {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
            </button>
          )}
        </div>
      )}

      {/* ── Action bar ── */}
      <div className="bg-border mx-4 h-px" />
      <div className="flex items-center px-2 py-1">
        {/* Reaction (Like) */}
        <FeedReactionButton postId={post.id} reactionCount={post.reactionCount} />

        {/* Comment */}
        <button
          type="button"
          onClick={() => setCommentDrawerOpen(true)}
          className="text-muted-foreground hover:bg-muted flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[15px] font-medium transition-colors"
        >
          <MessageCircle className="h-[18px] w-[18px]" />
          <span className="hidden sm:inline">Comment</span>
        </button>

        {/* Share */}
        <button
          type="button"
          onClick={() => (status === "authenticated" ? setShareSheetOpen(true) : undefined)}
          className="text-muted-foreground hover:bg-muted flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[15px] font-medium transition-colors"
          aria-label="Share"
        >
          <Share2 className="h-[18px] w-[18px]" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>

      {/* ── Inline comment input ── */}
      <div className="bg-border mx-4 h-px" />
      <div className="flex items-center gap-2 px-4 py-2 pb-3">
        <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
          {session?.user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt=""
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <span className="text-muted-foreground text-xs font-semibold">
              {session?.user?.name?.charAt(0)?.toUpperCase() || "?"}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setCommentDrawerOpen(true)}
          className="bg-muted text-muted-foreground hover:bg-muted/80 flex-1 rounded-[20px] px-3.5 py-2 text-left text-[15px] transition-colors"
        >
          Write a comment…
        </button>
      </div>

      {/* Image preview lightbox */}
      {previewIndex !== null && images.length > 0 && (
        <ImagePreview
          images={images}
          initialIndex={previewIndex}
          onClose={() => setPreviewIndex(null)}
          authorName={post.author.name}
        />
      )}

      {/* Comment drawer */}
      <FeedCommentDrawer
        postId={post.id}
        open={commentDrawerOpen}
        onOpenChange={setCommentDrawerOpen}
      />

      {/* Share sheet */}
      <ShareSheet
        open={shareSheetOpen}
        onOpenChange={setShareSheetOpen}
        postUrl={postHref}
        postTitle={post.title}
      />
    </motion.article>
  );
}

// ── Image Preview Lightbox ──

interface ImagePreviewProps {
  images: Array<{ url: string; key: string }>;
  initialIndex: number;
  onClose: () => void;
  authorName: string | null;
}

function ImagePreview({ images, initialIndex, onClose, authorName }: ImagePreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentImage = images[currentIndex];
  const hasMultiple = images.length > 1;

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          if (isFullscreen) {
            document.exitFullscreen?.();
          } else {
            onClose();
          }
          break;
        case "ArrowLeft":
          if (hasMultiple) setCurrentIndex((i) => (i > 0 ? i - 1 : images.length - 1));
          break;
        case "ArrowRight":
          if (hasMultiple) setCurrentIndex((i) => (i < images.length - 1 ? i + 1 : 0));
          break;
        case "+":
        case "=":
          setZoom((z) => Math.min(z + 0.5, 5));
          break;
        case "-":
          setZoom((z) => Math.max(z - 0.5, 0.5));
          break;
        case "0":
          setZoom(1);
          break;
      }
    };

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, hasMultiple, images.length, isFullscreen]);

  // Reset zoom on image change
  useEffect(() => {
    setZoom(1); // eslint-disable-line react-hooks/set-state-in-effect
  }, [currentIndex]);

  // Fullscreen listeners
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleDownload = async () => {
    try {
      const res = await fetch(currentImage.url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `image-${currentIndex + 1}.${blob.type.split("/")[1] || "jpg"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Image downloaded!");
    } catch {
      toast.error("Failed to download image");
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: `Image by ${authorName}`, url: currentImage.url });
      } else {
        await navigator.clipboard.writeText(currentImage.url);
        toast.success("Image link copied!");
      }
    } catch {
      /* user cancelled */
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await containerRef.current.requestFullscreen();
    }
  };

  return createPortal(
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-1 text-sm text-white/70">
          {hasMultiple && (
            <span>
              {currentIndex + 1} / {images.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.5, 0.5))}
            className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            title="Zoom out"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="min-w-[3rem] rounded-lg px-2 py-1 text-center text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            title="Reset zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.5, 5))}
            className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            title="Zoom in"
          >
            <ZoomIn className="h-5 w-5" />
          </button>

          <div className="mx-1 h-5 w-px bg-white/20" />

          <button
            onClick={handleShare}
            className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            title="Share"
          >
            <Share2 className="h-5 w-5" />
          </button>
          <button
            onClick={handleDownload}
            className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            title="Download"
          >
            <Download className="h-5 w-5" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            title="Fullscreen"
          >
            <Maximize className="h-5 w-5" />
          </button>

          <div className="mx-1 h-5 w-px bg-white/20" />

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Image area */}
      <div className="relative flex flex-1 items-center justify-center overflow-auto">
        {/* Previous button */}
        {hasMultiple && (
          <button
            onClick={() => setCurrentIndex((i) => (i > 0 ? i - 1 : images.length - 1))}
            className="absolute left-2 z-10 rounded-full bg-black/50 p-2 text-white/80 transition-colors hover:bg-black/70 hover:text-white sm:left-4"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentImage.url}
          alt=""
          className="max-h-full max-w-full object-contain transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* Next button */}
        {hasMultiple && (
          <button
            onClick={() => setCurrentIndex((i) => (i < images.length - 1 ? i + 1 : 0))}
            className="absolute right-2 z-10 rounded-full bg-black/50 p-2 text-white/80 transition-colors hover:bg-black/70 hover:text-white sm:right-4"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Thumbnail strip for multiple images */}
      {hasMultiple && (
        <div className="flex items-center justify-center gap-2 px-4 py-3">
          {images.map((img, i) => (
            <button
              key={img.key}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                "h-12 w-12 overflow-hidden rounded-lg ring-2 transition-all",
                i === currentIndex
                  ? "scale-110 ring-white"
                  : "opacity-60 ring-white/20 hover:opacity-100"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}

// ── Helpers ──

function extractBodyText(body: unknown, maxLen = 500): string {
  if (!body || typeof body !== "object") return "";
  const texts: string[] = [];
  walkNode(body, texts);
  return texts.join(" ").trim().slice(0, maxLen);
}

function walkNode(node: unknown, out: string[]) {
  if (!node || typeof node !== "object") return;
  const n = node as Record<string, unknown>;
  if (typeof n.text === "string") out.push(n.text);
  if (Array.isArray(n.content)) {
    for (const child of n.content) walkNode(child, out);
  }
}

function PostBody({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);

  // Extract hashtags from text
  const hashtags = text.match(/#\w+/g) || [];
  const needsTruncation = text.length > 300 || text.split("\n").length > 5;

  return (
    <div className="px-4 pt-1 pb-2">
      <div
        className={cn(
          "text-foreground text-[15px] leading-[1.4] break-words whitespace-pre-wrap",
          !expanded && needsTruncation && "line-clamp-5"
        )}
      >
        {text}
      </div>
      {needsTruncation && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-foreground mt-0.5 text-[15px] font-semibold hover:underline"
        >
          See more
        </button>
      )}
      {expanded && needsTruncation && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-foreground mt-0.5 text-[15px] font-semibold hover:underline"
        >
          See less
        </button>
      )}
      {hashtags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {hashtags.map((tag, i) => (
            <span key={i} className="text-brand cursor-pointer text-[14px] hover:underline">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
