"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";

type Props = {
  value?: string;
  onChange: (url: string) => void;
};

export function CoverArtUpload({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayUrl = preview ?? value ?? null;

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Max file size is 5MB");
        return;
      }

      setError("");
      setUploading(true);
      const localPreview = URL.createObjectURL(file);
      setPreview(localPreview);

      try {
        const { data } = await axios.post("/api/admin/media", {
          filename: file.name,
          contentType: file.type,
          size: file.size,
          folder: "fanlink-covers",
        });

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", data.uploadUrl, true);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject());
          xhr.onerror = () => reject(new Error("Network error"));
          xhr.send(file);
        });

        onChange(data.media.url);
        setPreview(null);
        URL.revokeObjectURL(localPreview);
      } catch {
        setError("Upload failed. Please try again.");
        setPreview(null);
        URL.revokeObjectURL(localPreview);
      } finally {
        setUploading(false);
      }
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleClear = () => {
    onChange("");
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  if (displayUrl && !uploading) {
    return (
      <div className="border-border/40 relative h-40 w-40 overflow-hidden rounded-2xl border shadow-md">
        <Image src={displayUrl} alt="Cover art" fill className="object-cover" sizes="160px" />
        <button
          type="button"
          onClick={handleClear}
          className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !uploading && inputRef.current?.click()}
        className={cn(
          "flex h-40 w-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed transition-all",
          uploading
            ? "border-brand/40 bg-brand/5"
            : "border-border/50 hover:border-brand/40 hover:bg-brand/5"
        )}
      >
        {uploading ? (
          <>
            <Loader2 className="text-brand h-6 w-6 animate-spin" />
            <span className="text-muted-foreground text-xs">Uploading…</span>
          </>
        ) : (
          <>
            <ImageIcon className="text-muted-foreground h-6 w-6" />
            <span className="text-muted-foreground px-2 text-center text-[11px]">
              Drop image or click
            </span>
            <Upload className="text-muted-foreground/50 h-3.5 w-3.5" />
          </>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </div>
  );
}
