"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileIcon,
  ImageIcon,
  Music,
  FileVideo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import axios from "axios";
import toast from "react-hot-toast";

interface UppyUploaderProps {
  folder?: string;
  onUploadComplete?: () => void;
  allowedFileTypes?: string[];
  maxFileSize?: number;
  maxNumberOfFiles?: number;
}

interface FileUpload {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  previewUrl?: string;
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return ImageIcon;
  if (type.startsWith("audio/")) return Music;
  if (type.startsWith("video/")) return FileVideo;
  return FileIcon;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UppyUploader({
  folder = "",
  onUploadComplete,
  allowedFileTypes = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
    "image/svg+xml",
    "audio/mpeg",
    "audio/mp4",
    "audio/wav",
    "audio/flac",
    "audio/ogg",
    "audio/aac",
    "audio/x-m4a",
    "video/mp4",
    "video/webm",
    "application/pdf",
  ],
  maxFileSize = 100 * 1024 * 1024,
  maxNumberOfFiles = 20,
}: UppyUploaderProps) {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCountRef = useRef(0);

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const validFiles: FileUpload[] = [];

      for (const file of fileArray) {
        if (files.length + validFiles.length >= maxNumberOfFiles) {
          toast.error(`Maximum ${maxNumberOfFiles} files allowed`);
          break;
        }
        if (!allowedFileTypes.includes(file.type)) {
          toast.error(`${file.name}: unsupported file type`);
          continue;
        }
        if (file.size > maxFileSize) {
          toast.error(`${file.name}: exceeds ${Math.round(maxFileSize / (1024 * 1024))}MB limit`);
          continue;
        }

        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;

        validFiles.push({
          id,
          file,
          progress: 0,
          status: "pending",
          previewUrl,
        });
      }

      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles]);
        for (const f of validFiles) {
          uploadFile(f);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [files.length, maxNumberOfFiles, allowedFileTypes, maxFileSize, folder]
  );

  async function uploadFile(fileUpload: FileUpload) {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileUpload.id ? { ...f, status: "uploading" as const } : f))
    );

    try {
      const { data } = await axios.post("/api/admin/media", {
        filename: fileUpload.file.name,
        contentType: fileUpload.file.type,
        size: fileUpload.file.size,
        folder,
      });

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", data.uploadUrl, true);
        xhr.setRequestHeader("Content-Type", fileUpload.file.type || "application/octet-stream");

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setFiles((prev) => prev.map((f) => (f.id === fileUpload.id ? { ...f, progress } : f)));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        };

        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(fileUpload.file);
      });

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileUpload.id ? { ...f, status: "success" as const, progress: 100 } : f
        )
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileUpload.id ? { ...f, status: "error" as const, error: message } : f
        )
      );
    }
  }

  const allDone =
    files.length > 0 && files.every((f) => f.status === "success" || f.status === "error");
  const successCount = files.filter((f) => f.status === "success").length;
  const isUploading = files.some((f) => f.status === "uploading");

  function handleDone() {
    for (const f of files) {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    }
    setFiles([]);
    if (successCount > 0) {
      toast.success(`${successCount} file${successCount > 1 ? "s" : ""} uploaded`);
      onUploadComplete?.();
    }
  }

  function removeFile(id: string) {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className={cn(
          "relative flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all",
          isDragging
            ? "border-brand bg-brand/5 scale-[1.01]"
            : "border-border hover:border-foreground/20 bg-muted/30"
        )}
        onDragEnter={(e) => {
          e.preventDefault();
          dragCountRef.current++;
          setIsDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
        }}
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
            addFiles(e.dataTransfer.files);
          }
        }}
      >
        <div
          className={cn(
            "mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-colors",
            isDragging ? "bg-brand/10" : "bg-muted"
          )}
        >
          <Upload
            className={cn(
              "h-7 w-7 transition-colors",
              isDragging ? "text-brand" : "text-muted-foreground"
            )}
          />
        </div>

        <p className="text-foreground text-sm font-semibold">
          {isDragging ? "Drop files here" : "Drag & drop files here"}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">or click to browse</p>
        <p className="text-muted-foreground/60 mt-3 text-[11px]">
          Max {maxNumberOfFiles} files, {Math.round(maxFileSize / (1024 * 1024))}
          MB each. Images, audio, video, or PDF.
        </p>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4 gap-2"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="h-4 w-4" />
          Browse Files
        </Button>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={allowedFileTypes.join(",")}
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
          className="hidden"
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {files.length} file{files.length > 1 ? "s" : ""}
              {isUploading && " uploading..."}
            </p>
            {allDone && (
              <Button
                size="sm"
                onClick={handleDone}
                className="bg-brand hover:bg-brand/90 text-brand-foreground gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Done
              </Button>
            )}
          </div>

          <div className="divide-y rounded-xl border">
            {files.map((f) => {
              const Icon = getFileIcon(f.file.type);
              return (
                <div key={f.id} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                    {f.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.previewUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Icon className="text-muted-foreground h-5 w-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{f.file.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">
                        {formatSize(f.file.size)}
                      </span>
                      {f.status === "uploading" && (
                        <span className="text-brand text-xs font-medium">{f.progress}%</span>
                      )}
                      {f.status === "error" && (
                        <span className="text-destructive text-xs">{f.error}</span>
                      )}
                    </div>

                    {f.status === "uploading" && (
                      <div className="bg-muted mt-1.5 h-1 w-full overflow-hidden rounded-full">
                        <div
                          className="bg-brand h-full rounded-full transition-all duration-300"
                          style={{ width: `${f.progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="shrink-0">
                    {f.status === "uploading" && (
                      <Loader2 className="text-brand h-4 w-4 animate-spin" />
                    )}
                    {f.status === "success" && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )}
                    {f.status === "error" && <AlertCircle className="text-destructive h-4 w-4" />}
                    {f.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => removeFile(f.id)}
                        className="text-muted-foreground hover:text-foreground p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
