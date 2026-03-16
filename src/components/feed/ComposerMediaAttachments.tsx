"use client";

import { useState, useRef, forwardRef, useImperativeHandle } from "react";
import { X, Image as ImageIcon, Film, Music } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useUploadMedia } from "@/hooks/useUploadMedia";
import { notify } from "@/hooks/useToast";

export interface MediaAttachment {
  url: string;
  key: string;
  type: "IMAGE" | "VIDEO" | "AUDIO";
  mimeType: string;
  width?: number;
  height?: number;
  /** Local preview URL for images/videos before upload completes */
  previewUrl?: string;
  /** Upload state */
  uploading?: boolean;
}

interface ComposerMediaAttachmentsProps {
  attachments: MediaAttachment[];
  onChange: (
    attachments: MediaAttachment[] | ((prev: MediaAttachment[]) => MediaAttachment[])
  ) => void;
  maxAttachments?: number;
  /** Hide internal action buttons (when rendered externally in dialog footer) */
  showActions?: boolean;
}

export interface ComposerMediaRef {
  openFilePicker: (accept: string) => void;
}

export const ACCEPTED_IMAGE = "image/png,image/jpeg,image/webp,image/gif";
export const ACCEPTED_VIDEO = "video/mp4,video/webm,video/quicktime";
export const ACCEPTED_AUDIO = "audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/x-m4a,audio/aac";
const ALL_ACCEPTED = `${ACCEPTED_IMAGE},${ACCEPTED_VIDEO},${ACCEPTED_AUDIO}`;

export const ComposerMediaAttachments = forwardRef<ComposerMediaRef, ComposerMediaAttachmentsProps>(
  function ComposerMediaAttachments(
    { attachments, onChange, maxAttachments = 10, showActions = true },
    ref
  ) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadType, setUploadType] = useState<string>(ALL_ACCEPTED);
    const upload = useUploadMedia();

    const openFilePicker = (accept: string) => {
      setUploadType(accept);
      requestAnimationFrame(() => {
        fileInputRef.current?.click();
      });
    };

    useImperativeHandle(ref, () => ({
      openFilePicker: (accept: string) => openFilePicker(accept),
    }));

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      const remaining = maxAttachments - attachments.length;
      if (files.length > remaining) {
        notify.info(`Maximum ${maxAttachments} attachments allowed`);
      }

      const toUpload = files.slice(0, remaining);

      for (let i = 0; i < toUpload.length; i++) {
        const file = toUpload[i];
        // Create local preview
        const previewUrl =
          file.type.startsWith("image/") || file.type.startsWith("video/")
            ? URL.createObjectURL(file)
            : undefined;

        const resolvedType = file.type.startsWith("image/")
          ? "IMAGE"
          : file.type.startsWith("video/")
            ? "VIDEO"
            : "AUDIO";

        // Add placeholder
        const placeholder: MediaAttachment = {
          url: "",
          key: `uploading-${Date.now()}-${i}`,
          type: resolvedType as "IMAGE" | "VIDEO" | "AUDIO",
          mimeType: file.type,
          previewUrl,
          uploading: true,
        };

        const placeholderKey = placeholder.key;

        onChange((prev) => [...prev, placeholder]);

        try {
          const result = await upload.mutateAsync({ file });
          // Replace placeholder with real data
          onChange((prev) => {
            const updated = [...prev];
            const idx = updated.findIndex((a) => a.key === placeholderKey);
            if (idx !== -1) {
              updated[idx] = {
                url: result.url,
                key: result.key,
                type: result.type,
                mimeType: result.mimeType,
                previewUrl,
                uploading: false,
              };
            }
            return updated;
          });
        } catch {
          // Remove failed placeholder
          onChange((prev) => prev.filter((a) => a.key !== placeholderKey));
        }
      }

      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeAttachment = (index: number) => {
      const updated = attachments.filter((_, i) => i !== index);
      onChange(updated);
    };

    const canAddMore = attachments.length < maxAttachments;

    return (
      <div className="space-y-3">
        {/* Attachment grid */}
        <AnimatePresence mode="popLayout">
          {attachments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="grid gap-2"
              style={{
                gridTemplateColumns:
                  attachments.length === 1
                    ? "1fr"
                    : attachments.length === 2
                      ? "1fr 1fr"
                      : "repeat(3, 1fr)",
              }}
            >
              {attachments.map((att, i) => (
                <motion.div
                  key={att.key || `uploading-${i}`}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative overflow-hidden rounded-xl"
                >
                  {/* Image preview */}
                  {att.type === "IMAGE" && (
                    <div className="relative aspect-square">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={att.previewUrl || att.url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      {att.uploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <div className="border-brand h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Video preview */}
                  {att.type === "VIDEO" && (
                    <div className="relative aspect-video">
                      {att.previewUrl ? (
                        <video src={att.previewUrl} className="h-full w-full object-cover" muted />
                      ) : (
                        <div className="bg-muted flex h-full items-center justify-center">
                          <Film className="text-muted-foreground h-8 w-8" />
                        </div>
                      )}
                      {att.uploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <div className="border-brand h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
                        </div>
                      )}
                      <div className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                        VIDEO
                      </div>
                    </div>
                  )}

                  {/* Audio preview */}
                  {att.type === "AUDIO" && (
                    <div className="bg-muted flex aspect-square items-center justify-center rounded-xl">
                      <div className="flex flex-col items-center gap-1">
                        <Music className="text-brand h-8 w-8" />
                        <span className="text-muted-foreground text-[10px]">Audio</span>
                      </div>
                      {att.uploading && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
                          <div className="border-brand h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Remove button */}
                  {!att.uploading && (
                    <button
                      onClick={() => removeAttachment(i)}
                      className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        {showActions && canAddMore && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => openFilePicker(ACCEPTED_IMAGE)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <ImageIcon className="h-4 w-4 text-emerald-500" />
              <span className="hidden sm:inline">Photo</span>
            </button>
            <button
              type="button"
              onClick={() => openFilePicker(ACCEPTED_VIDEO)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Film className="h-4 w-4 text-rose-500" />
              <span className="hidden sm:inline">Video</span>
            </button>
            <button
              type="button"
              onClick={() => openFilePicker(ACCEPTED_AUDIO)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Music className="h-4 w-4 text-violet-500" />
              <span className="hidden sm:inline">Audio</span>
            </button>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={uploadType}
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    );
  }
);
