"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X, Loader2, CheckCircle2, AlertCircle, Music, FileAudio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import axios from "axios";
import toast from "react-hot-toast";
import { extractID3Tags, extractAudioDuration, mimeToFormat } from "@/lib/audio-metadata";

const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
  "audio/flac",
  "audio/x-flac",
  "audio/ogg",
  "audio/aac",
  "audio/x-m4a",
];

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

export interface AudioUploadResult {
  r2Key: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  url: string;
  mediaId: string;
}

export interface AudioMetadataResult {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  year?: number;
  trackNumber?: number;
  label?: string;
  duration?: number;
  bitrate?: number;
  format?: string;
  coverArtPreviewUrl?: string;
}

interface AudioUploadZoneProps {
  onUploadComplete: (result: AudioUploadResult) => void;
  onMetadataExtracted: (metadata: AudioMetadataResult) => void;
  onCoverArtUploaded?: (url: string) => void;
  onFileSelected?: () => void;
  disabled?: boolean;
}

/** Upload a blob to R2 via the presigned URL flow */
async function uploadBlobToR2(
  blob: Blob,
  filename: string,
  folder: string,
  contentType: string
): Promise<{ url: string; mediaId: string }> {
  const { data } = await axios.post("/api/admin/media", {
    filename,
    contentType,
    size: blob.size,
    folder,
  });

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", data.uploadUrl, true);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed: ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(blob);
  });

  return { url: data.media.url, mediaId: data.media.id };
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type UploadStatus = "idle" | "processing" | "uploading" | "success" | "error";

export function AudioUploadZone({
  onUploadComplete,
  onMetadataExtracted,
  onCoverArtUploaded,
  onFileSelected,
  disabled = false,
}: AudioUploadZoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [metadataExtracted, setMetadataExtracted] = useState(false);
  const [extractedMeta, setExtractedMeta] = useState<AudioMetadataResult | null>(null);
  const [coverArtPreviewUrl, setCoverArtPreviewUrl] = useState<string | null>(null);
  const [coverArtUploadStatus, setCoverArtUploadStatus] = useState<
    "idle" | "uploading" | "done" | "error"
  >("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCountRef = useRef(0);

  // Cleanup cover art blob URL on unmount
  useEffect(() => {
    return () => {
      if (coverArtPreviewUrl) URL.revokeObjectURL(coverArtPreviewUrl);
    };
  }, [coverArtPreviewUrl]);

  const handleFile = useCallback(
    async (selectedFile: File) => {
      if (!ALLOWED_AUDIO_TYPES.includes(selectedFile.type)) {
        toast.error("Unsupported audio format. Use MP3, WAV, FLAC, OGG, or AAC.");
        return;
      }
      if (selectedFile.size > MAX_FILE_SIZE) {
        toast.error(`File exceeds ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB limit`);
        return;
      }

      setFile(selectedFile);
      setStatus("processing");
      setError(null);
      setProgress(0);
      setMetadataExtracted(false);
      onFileSelected?.();

      const format = mimeToFormat(selectedFile.type);

      // Extract metadata and upload in parallel
      const [id3Result, durationResult] = await Promise.all([
        extractID3Tags(selectedFile),
        extractAudioDuration(selectedFile),
      ]);

      const metadata: AudioMetadataResult = {
        title: id3Result.title,
        artist: id3Result.artist,
        album: id3Result.album,
        genre: id3Result.genre,
        year: id3Result.year,
        trackNumber: id3Result.trackNumber,
        label: id3Result.label,
        duration: durationResult?.duration,
        bitrate: durationResult?.bitrate,
        format,
      };

      // Handle embedded cover art — preview + auto-upload to R2
      if (id3Result.coverArtBlob) {
        const previewUrl = URL.createObjectURL(id3Result.coverArtBlob);
        if (coverArtPreviewUrl) URL.revokeObjectURL(coverArtPreviewUrl);
        setCoverArtPreviewUrl(previewUrl);
        metadata.coverArtPreviewUrl = previewUrl;

        // Auto-upload cover art blob to R2 in background
        if (onCoverArtUploaded) {
          setCoverArtUploadStatus("uploading");
          const ext = id3Result.coverArtBlob.type.includes("png") ? "png" : "jpg";
          uploadBlobToR2(
            id3Result.coverArtBlob,
            `cover.${ext}`,
            "covers",
            id3Result.coverArtBlob.type
          )
            .then(({ url }) => {
              setCoverArtUploadStatus("done");
              onCoverArtUploaded(url);
            })
            .catch(() => {
              setCoverArtUploadStatus("error");
            });
        }
      }

      const hasAnyTag = id3Result.title || id3Result.artist || id3Result.genre;
      if (hasAnyTag) {
        toast.success("Metadata extracted from audio file");
      } else {
        toast("No ID3 metadata found — fill in manually", { icon: "ℹ️" });
      }

      setExtractedMeta(metadata);
      setMetadataExtracted(true);
      onMetadataExtracted(metadata);

      // Start upload
      setStatus("uploading");
      try {
        const { data } = await axios.post("/api/admin/media", {
          filename: selectedFile.name,
          contentType: selectedFile.type,
          size: selectedFile.size,
          folder: "tracks",
        });

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", data.uploadUrl, true);
          xhr.setRequestHeader("Content-Type", selectedFile.type || "application/octet-stream");

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 100));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`Upload failed: ${xhr.status}`));
          };

          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.send(selectedFile);
        });

        setStatus("success");
        setProgress(100);

        onUploadComplete({
          r2Key: data.media.r2Key,
          filename: data.media.filename,
          fileSize: data.media.size,
          mimeType: data.media.mimeType,
          url: data.media.url,
          mediaId: data.media.id,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setStatus("error");
        setError(message);
        toast.error(message);
      }
    },
    [onUploadComplete, onMetadataExtracted, onCoverArtUploaded, onFileSelected, coverArtPreviewUrl]
  );

  function reset() {
    if (coverArtPreviewUrl) URL.revokeObjectURL(coverArtPreviewUrl);
    setFile(null);
    setStatus("idle");
    setProgress(0);
    setError(null);
    setMetadataExtracted(false);
    setExtractedMeta(null);
    setCoverArtPreviewUrl(null);
    setCoverArtUploadStatus("idle");
  }

  // Idle state — show drop zone
  if (status === "idle") {
    return (
      <div
        className={cn(
          "relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all",
          isDragging
            ? "border-brand bg-brand/5 scale-[1.01]"
            : "border-border hover:border-foreground/20 bg-muted/30",
          disabled && "pointer-events-none opacity-50"
        )}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          dragCountRef.current++;
          setIsDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          e.preventDefault();
          dragCountRef.current--;
          if (dragCountRef.current === 0) setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          dragCountRef.current = 0;
          setIsDragging(false);
          if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
          }
        }}
      >
        <div
          className={cn(
            "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors",
            isDragging ? "bg-brand/10" : "bg-muted"
          )}
        >
          <Music
            className={cn(
              "h-6 w-6 transition-colors",
              isDragging ? "text-brand" : "text-muted-foreground"
            )}
          />
        </div>
        <p className="text-foreground text-sm font-semibold">
          {isDragging ? "Drop your audio file here" : "Drag & drop audio file here"}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">or click to browse</p>
        <p className="text-muted-foreground/60 mt-3 text-[11px]">
          MP3, WAV, FLAC, OGG, AAC — Max {Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_AUDIO_TYPES.join(",")}
          onChange={(e) => {
            if (e.target.files?.[0]) handleFile(e.target.files[0]);
            e.target.value = "";
          }}
          className="hidden"
        />
      </div>
    );
  }

  // File selected — show status
  return (
    <div className="space-y-3">
      <div className="border-border bg-card flex items-center gap-3 rounded-xl border p-4">
        {/* File icon */}
        <div className="bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
          <FileAudio className="text-muted-foreground h-6 w-6" />
        </div>

        {/* File info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold">{file?.name}</p>
            {extractedMeta?.format && (
              <Badge variant="secondary" className="shrink-0 text-[10px] tracking-wide uppercase">
                {extractedMeta.format}
              </Badge>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-3">
            <span className="text-muted-foreground text-xs">
              {file ? formatSize(file.size) : ""}
            </span>
            {extractedMeta?.duration != null && (
              <span className="text-muted-foreground text-xs">
                {formatDuration(extractedMeta.duration)}
              </span>
            )}
            {extractedMeta?.bitrate != null && (
              <span className="text-muted-foreground text-xs">{extractedMeta.bitrate} kbps</span>
            )}
          </div>

          {/* Progress bar */}
          {status === "uploading" && (
            <div className="bg-muted mt-2 h-1.5 w-full overflow-hidden rounded-full">
              <div
                className="bg-brand h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {status === "error" && error && <p className="text-destructive mt-1 text-xs">{error}</p>}
        </div>

        {/* Status icon + actions */}
        <div className="flex shrink-0 items-center gap-2">
          {status === "processing" && (
            <div className="text-muted-foreground flex items-center gap-1.5">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Extracting...</span>
            </div>
          )}
          {status === "uploading" && (
            <div className="text-brand flex items-center gap-1.5">
              <Upload className="h-4 w-4" />
              <span className="text-xs font-medium">{progress}%</span>
            </div>
          )}
          {status === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          {status === "error" && <AlertCircle className="text-destructive h-5 w-5" />}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={reset}
            title="Remove and start over"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove file</span>
          </Button>
        </div>
      </div>

      {/* Metadata extraction badge */}
      {metadataExtracted && (
        <div className="flex items-center gap-2 text-xs">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            ID3 tags extracted
          </span>
          {extractedMeta?.title && (
            <span className="text-muted-foreground">
              — {extractedMeta.title}
              {extractedMeta.artist ? ` by ${extractedMeta.artist}` : ""}
            </span>
          )}
        </div>
      )}

      {/* Embedded cover art preview + upload status */}
      {coverArtPreviewUrl && (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverArtPreviewUrl}
            alt="Embedded cover art"
            className="border-border h-12 w-12 rounded-lg border object-cover"
          />
          <div className="flex items-center gap-1.5 text-xs">
            {coverArtUploadStatus === "uploading" && (
              <>
                <Loader2 className="text-muted-foreground h-3.5 w-3.5 animate-spin" />
                <span className="text-muted-foreground">Uploading cover art...</span>
              </>
            )}
            {coverArtUploadStatus === "done" && (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  Cover art uploaded
                </span>
              </>
            )}
            {coverArtUploadStatus === "error" && (
              <>
                <AlertCircle className="text-destructive h-3.5 w-3.5" />
                <span className="text-destructive">Cover art upload failed — pick manually</span>
              </>
            )}
            {coverArtUploadStatus === "idle" && (
              <span className="text-muted-foreground">Embedded cover art detected</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
