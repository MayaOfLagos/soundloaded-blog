"use client";

import { useState, useRef, useCallback } from "react";
import { Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoStoryComposerProps {
  onComplete: (data: { file: File; caption: string }) => void;
  onBack: () => void;
  onDirty: () => void;
}

export function VideoStoryComposer({ onComplete, onBack, onDirty }: VideoStoryComposerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (!selected || !selected.type.startsWith("video/")) return;
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      onDirty();
    },
    [onDirty]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const dropped = e.dataTransfer.files[0];
      if (!dropped || !dropped.type.startsWith("video/")) return;
      setFile(dropped);
      setPreviewUrl(URL.createObjectURL(dropped));
      onDirty();
    },
    [onDirty]
  );

  const handleNext = useCallback(() => {
    if (!file) return;
    onComplete({ file, caption });
  }, [file, caption, onComplete]);

  const fileSizeMB = file ? (file.size / (1024 * 1024)).toFixed(1) : null;

  return (
    <div className="flex h-full flex-col">
      {!file ? (
        <div className="flex flex-1 flex-col items-center justify-center p-6">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-border hover:border-brand/50 hover:bg-brand/5 flex w-full cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-dashed p-10 transition-colors"
          >
            <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
              <Video className="text-muted-foreground h-7 w-7" />
            </div>
            <div className="text-center">
              <p className="text-foreground font-medium">Tap to choose a video</p>
              <p className="text-muted-foreground mt-1 text-sm">or drag and drop</p>
              <p className="text-muted-foreground/70 mt-2 text-xs">
                MP4, WebM — recommended under 50MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          {/* Video preview */}
          <div className="relative mx-auto aspect-[9/16] w-full max-w-xs overflow-hidden rounded-2xl bg-black">
            <video
              src={previewUrl!}
              className="h-full w-full object-cover"
              controls
              playsInline
              muted
            />
            <button
              onClick={() => {
                setFile(null);
                setPreviewUrl(null);
              }}
              className="absolute top-3 right-3 z-10 rounded-full bg-black/50 p-1.5 text-white backdrop-blur-sm"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {fileSizeMB && (
            <p className="text-muted-foreground text-center text-xs">{fileSizeMB} MB</p>
          )}

          {/* Caption */}
          <textarea
            value={caption}
            onChange={(e) => {
              setCaption(e.target.value);
              onDirty();
            }}
            placeholder="Add a caption..."
            maxLength={280}
            rows={2}
            className="border-border bg-muted/50 text-foreground placeholder:text-muted-foreground w-full resize-none rounded-xl border px-4 py-3 text-sm focus:outline-none"
          />
          <p className="text-muted-foreground text-right text-[11px]">{caption.length}/280</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      <div className="border-border flex gap-2 border-t p-4">
        <Button variant="outline" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button className="bg-brand hover:bg-brand/90 flex-1" onClick={handleNext} disabled={!file}>
          Next
        </Button>
      </div>
    </div>
  );
}
