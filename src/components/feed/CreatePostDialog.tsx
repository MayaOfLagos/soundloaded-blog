"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { ArrowLeft } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { motion, AnimatePresence } from "motion/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import {
  ComposerMediaAttachments,
  type MediaAttachment,
  type ComposerMediaRef,
  ACCEPTED_IMAGE,
  ACCEPTED_VIDEO,
  ACCEPTED_AUDIO,
} from "./ComposerMediaAttachments";
import { useCreatePost } from "@/hooks/useCreatePost";
import { cn } from "@/lib/utils";

// Facebook-style filled SVG icons for media actions
function PhotoSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="3" width="20" height="18" rx="3" fill="#45BD62" />
      <circle cx="8.5" cy="9.5" r="2.5" fill="#E7F3E8" />
      <path
        d="M2 17l5.5-6a1.5 1.5 0 012.2 0L14 15.5l2.3-2.3a1.5 1.5 0 012.2 0L22 17v1a3 3 0 01-3 3H5a3 3 0 01-3-3v-1z"
        fill="#B4DDB7"
      />
    </svg>
  );
}

function VideoSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="1" y="4" width="16" height="16" rx="3" fill="#F3425F" />
      <path d="M19 8.5l3.2-2.1A.8.8 0 0123.5 7v10a.8.8 0 01-1.3.6L19 15.5V8.5z" fill="#F3425F" />
      <path d="M9 10v4l3.5-2L9 10z" fill="#FCE4EC" />
    </svg>
  );
}

function MusicSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="10" fill="#A033FF" />
      <path
        d="M10 7.5v7m0 0a2.5 2.5 0 11-2.5-2.5H10zm5-5v7m0 0a2.5 2.5 0 11-2.5-2.5H15z"
        stroke="#E8D5FF"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userAvatar?: string | null;
  userName?: string | null;
}

export function CreatePostDialog({
  open,
  onOpenChange,
  userAvatar,
  userName,
}: CreatePostDialogProps) {
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const [postStatus, setPostStatus] = useState<"idle" | "posting" | "posted">("idle");
  const mediaRef = useRef<ComposerMediaRef>(null);

  const createPost = useCreatePost();

  const handleAttachmentsChange = useCallback(
    (update: MediaAttachment[] | ((prev: MediaAttachment[]) => MediaAttachment[])) => {
      setAttachments(update);
    },
    []
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-brand underline cursor-pointer" },
      }),
      Placeholder.configure({
        placeholder: "What's on your mind?",
      }),
      Underline,
    ],
    content: { type: "doc", content: [{ type: "paragraph" }] },
    onUpdate: () => {
      setIsDirty(true);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm prose-zinc dark:prose-invert prose-a:text-brand max-w-none min-h-[120px] px-0 py-2 outline-none text-[15px] leading-relaxed",
      },
    },
    immediatelyRender: false,
  });

  const reset = useCallback(() => {
    editor?.commands.setContent({ type: "doc", content: [{ type: "paragraph" }] });
    setAttachments([]);
    setIsDirty(false);
    setPostStatus("idle");
  }, [editor]);

  const handleClose = useCallback(() => {
    if ((isDirty || attachments.length > 0) && postStatus === "idle") {
      setShowDiscard(true);
    } else if (postStatus === "idle") {
      reset();
      onOpenChange(false);
    }
  }, [isDirty, attachments, postStatus, reset, onOpenChange]);

  const handleDiscard = useCallback(() => {
    setShowDiscard(false);
    reset();
    onOpenChange(false);
  }, [reset, onOpenChange]);

  const handlePost = useCallback(async () => {
    if (!editor || postStatus !== "idle") return;

    const body = editor.getJSON();
    const isEmpty =
      !body.content ||
      body.content.length === 0 ||
      (body.content.length === 1 &&
        body.content[0].type === "paragraph" &&
        (!body.content[0].content || body.content[0].content.length === 0));

    if (isEmpty && attachments.length === 0) return;

    const mediaPayload = attachments
      .filter((a) => !a.uploading && a.url)
      .map(({ url, key, type, mimeType, width, height }) => ({
        url,
        key,
        type,
        mimeType,
        ...(width ? { width } : {}),
        ...(height ? { height } : {}),
      }));

    setPostStatus("posting");

    try {
      await createPost.mutateAsync({
        body,
        mediaAttachments: mediaPayload,
      });

      setPostStatus("posted");
      // Auto-close after success animation
      setTimeout(() => {
        reset();
        onOpenChange(false);
      }, 1500);
    } catch {
      setPostStatus("idle");
    }
  }, [editor, attachments, createPost, postStatus, reset, onOpenChange]);

  const isUploading = attachments.some((a) => a.uploading);
  const hasContent = isDirty || attachments.filter((a) => !a.uploading).length > 0;
  const canAddMore = attachments.length < 10;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : handleClose())}>
        <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden p-0 sm:max-w-lg">
          <VisuallyHidden>
            <DialogTitle>Create Post</DialogTitle>
          </VisuallyHidden>

          {/* ── Header ── */}
          <div className="border-border flex items-center justify-between border-b px-4 py-3">
            <button
              onClick={handleClose}
              className="bg-muted hover:bg-muted/80 text-foreground flex h-8 w-8 items-center justify-center rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-foreground text-base font-semibold">Create post</h2>
            {/* Spacer to keep title centered */}
            <div className="w-7" />
          </div>

          {/* ── Composer body ── */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {!editor ? (
              /* Skeleton while editor loads */
              <ComposerSkeleton />
            ) : (
              <>
                {/* Author info */}
                <div className="mb-3 flex items-center gap-3">
                  <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full">
                    {userAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={userAvatar}
                        alt={userName || ""}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-muted-foreground text-sm font-semibold">
                        {userName?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-foreground text-sm leading-tight font-semibold">
                      {userName || "Anonymous"}
                    </p>
                    <p className="text-muted-foreground text-[11px]">Public · Anyone can see</p>
                  </div>
                </div>

                {/* TipTap editor */}
                <div className="bg-muted/40 ring-border/50 rounded-xl px-3 ring-1">
                  <EditorContent editor={editor} />
                </div>

                {/* Media attachments (no internal action buttons) */}
                <div className="mt-3">
                  <ComposerMediaAttachments
                    ref={mediaRef}
                    attachments={attachments}
                    onChange={handleAttachmentsChange}
                    showActions={false}
                  />
                </div>
              </>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="border-border space-y-2.5 border-t px-4 py-3">
            {/* Add to your post bar */}
            <div className="ring-border/50 flex items-center justify-between rounded-xl px-3 py-2 ring-1">
              <span className="text-foreground text-sm font-medium">Add to your post</span>
              <div className="flex items-center gap-0.5">
                {canAddMore && (
                  <>
                    <button
                      type="button"
                      onClick={() => mediaRef.current?.openFilePicker(ACCEPTED_IMAGE)}
                      className="hover:bg-muted flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
                      title="Photo"
                    >
                      <PhotoSvg className="h-[22px] w-[22px]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => mediaRef.current?.openFilePicker(ACCEPTED_VIDEO)}
                      className="hover:bg-muted flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
                      title="Video"
                    >
                      <VideoSvg className="h-[22px] w-[22px]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => mediaRef.current?.openFilePicker(ACCEPTED_AUDIO)}
                      className="hover:bg-muted flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
                      title="Music"
                    >
                      <MusicSvg className="h-[22px] w-[22px]" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Upload status */}
            {isUploading && <p className="text-muted-foreground text-center text-xs">Uploading…</p>}
            {!isUploading && attachments.length > 0 && (
              <p className="text-muted-foreground text-center text-xs">
                {attachments.length} attachment{attachments.length > 1 ? "s" : ""}
              </p>
            )}

            {/* Full-width post button */}
            <PostStatusButton
              status={postStatus}
              onClick={handlePost}
              disabled={!hasContent || isUploading || postStatus !== "idle"}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Discard confirmation */}
      <AlertDialog open={showDiscard} onOpenChange={setShowDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard post?</AlertDialogTitle>
            <AlertDialogDescription>
              Your post hasn&apos;t been published. If you leave now, your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscard}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ── Editor Skeleton ──

function ComposerSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Author info skeleton */}
      <div className="flex items-center gap-3">
        <div className="bg-muted h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <div className="bg-muted h-3.5 w-28 rounded" />
          <div className="bg-muted h-2.5 w-36 rounded" />
        </div>
      </div>
      {/* Editor area skeleton */}
      <div className="space-y-2.5 pt-2">
        <div className="bg-muted h-3.5 w-full rounded" />
        <div className="bg-muted h-3.5 w-4/5 rounded" />
        <div className="bg-muted h-3.5 w-3/5 rounded" />
      </div>
    </div>
  );
}

// ── Post Status Button (adapted from uselayouts SaveButton) ──

interface PostStatusButtonProps {
  status: "idle" | "posting" | "posted";
  onClick: () => void;
  disabled?: boolean;
}

function PostStatusButton({ status, onClick, disabled }: PostStatusButtonProps) {
  const text = useMemo(() => {
    switch (status) {
      case "idle":
        return "Post";
      case "posting":
        return "Posting";
      case "posted":
        return "Posted";
    }
  }, [status]);

  return (
    <div className="group relative font-sans">
      <Button
        onClick={onClick}
        className={cn(
          "relative h-10 w-full rounded-lg text-sm font-semibold transition-all duration-300 disabled:opacity-100",
          status === "idle"
            ? "transition-colors"
            : "bg-muted text-muted-foreground hover:bg-muted border-muted cursor-not-allowed shadow-sm"
        )}
        variant="default"
        disabled={disabled}
      >
        <span className="flex items-center justify-center">
          <AnimatePresence mode="popLayout" initial={false}>
            {text.split("").map((char, i) => (
              <motion.span
                key={`${char}-${i}`}
                layout
                initial={{ opacity: 0, scale: 0, filter: "blur(4px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0, filter: "blur(4px)" }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  mass: 1,
                }}
                className="inline-block"
              >
                {char}
              </motion.span>
            ))}
          </AnimatePresence>
        </span>
      </Button>

      {/* Status Indicator Badge */}
      <div className="pointer-events-none absolute -top-1 -right-1 z-10">
        <AnimatePresence mode="wait">
          {status !== "idle" && (
            <motion.div
              initial={{ opacity: 0, scale: 0, x: -8, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0, x: -8, filter: "blur(4px)" }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={cn(
                "flex size-6 items-center justify-center overflow-visible rounded-full ring-3",
                status === "posted"
                  ? "bg-primary text-primary-foreground ring-muted"
                  : "bg-muted text-muted-foreground ring-muted"
              )}
            >
              <AnimatePresence mode="popLayout">
                {status === "posting" && (
                  <motion.div
                    key="loader"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M12 2A10 10 0 1 0 22 12A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8A8 8 0 0 1 12 20Z"
                        opacity=".5"
                      />
                      <path fill="currentColor" d="M20 12h2A10 10 0 0 0 12 2V4A8 8 0 0 1 20 12Z">
                        <animateTransform
                          attributeName="transform"
                          dur="1s"
                          from="0 12 12"
                          repeatCount="indefinite"
                          to="360 12 12"
                          type="rotate"
                        />
                      </path>
                    </svg>
                  </motion.div>
                )}
                {status === "posted" && (
                  <motion.div
                    key="check"
                    initial={{ scale: 0, opacity: 0, filter: "blur(4px)" }}
                    animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                    exit={{ scale: 0, opacity: 0, filter: "blur(4px)" }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <HugeiconsIcon icon={Tick02Icon} className="size-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
