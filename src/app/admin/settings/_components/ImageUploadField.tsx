"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/admin-api";

// FilePond core + plugins
import { FilePond, registerPlugin } from "react-filepond";
import type { FilePondFile, ProcessServerConfigFunction } from "filepond";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import FilePondPluginFileValidateSize from "filepond-plugin-file-validate-size";
import FilePondPluginImageCrop from "filepond-plugin-image-crop";
import FilePondPluginImageResize from "filepond-plugin-image-resize";
import FilePondPluginImageTransform from "filepond-plugin-image-transform";

// FilePond styles
import "@/styles/filepond.css";

// Register plugins once
registerPlugin(
  FilePondPluginImagePreview,
  FilePondPluginFileValidateType,
  FilePondPluginFileValidateSize,
  FilePondPluginImageCrop,
  FilePondPluginImageResize,
  FilePondPluginImageTransform
);

interface ImageUploadFieldProps {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  type: string;
  hint?: string;
  acceptedFileTypes?: string[];
  maxFileSize?: string;
  imageCropAspectRatio?: string;
  previewWidth?: number;
  previewHeight?: number;
}

function resolvePreviewUrl(key: string | null): string | null {
  if (!key) return null;
  if (key.startsWith("/") || key.startsWith("http")) return key;
  const cdn = process.env.NEXT_PUBLIC_CDN_URL;
  return cdn ? `${cdn}/${key}` : `/${key}`;
}

export function ImageUploadField({
  label,
  value,
  onChange,
  type,
  hint,
  acceptedFileTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"],
  maxFileSize = "2MB",
  imageCropAspectRatio,
  previewWidth = 200,
  previewHeight = 100,
}: ImageUploadFieldProps) {
  const [files, setFiles] = useState<FilePondFile[]>([]);
  const previewUrl = resolvePreviewUrl(value);

  // Custom server process function for presigned R2 uploads
  const serverConfig = useMemo(
    () => ({
      process: ((
        _fieldName: string,
        file: unknown,
        _metadata: Record<string, unknown>,
        load: (id: string) => void,
        error: (message: string) => void,
        progress: (computable: boolean, loaded: number, total: number) => void,
        abort: () => void
      ) => {
        const controller = new AbortController();
        const f = file as File;

        (async () => {
          try {
            // 1. Get presigned URL from our API
            const { data } = await adminApi.post("/api/admin/settings/upload", {
              type,
              contentType: f.type,
              filename: f.name,
            });

            // 2. Upload directly to R2
            const xhr = new XMLHttpRequest();
            xhr.open("PUT", data.uploadUrl, true);
            xhr.setRequestHeader("Content-Type", f.type);

            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                progress(true, e.loaded, e.total);
              }
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                onChange(data.r2Key);
                load(data.r2Key);
                toast.success("Image uploaded");
              } else {
                error("Upload failed");
                toast.error("Upload failed");
              }
            };

            xhr.onerror = () => {
              error("Upload failed");
              toast.error("Upload failed");
            };

            controller.signal.addEventListener("abort", () => {
              xhr.abort();
            });

            xhr.send(f);
          } catch {
            error("Upload failed");
            toast.error("Upload failed");
          }
        })();

        return {
          abort: () => {
            controller.abort();
            abort();
          },
        };
      }) as ProcessServerConfigFunction,
    }),
    [type, onChange]
  );

  // If there's already an uploaded image, show preview with remove option
  if (value && previewUrl) {
    return (
      <div className="space-y-2">
        <label className="text-foreground text-sm font-medium">{label}</label>
        {hint && <p className="text-muted-foreground text-xs">{hint}</p>}

        <div className="relative inline-block">
          <div
            className="bg-muted overflow-hidden rounded-lg border"
            style={{ width: previewWidth, height: previewHeight }}
          >
            <Image
              src={previewUrl}
              alt={label}
              width={previewWidth}
              height={previewHeight}
              className="h-full w-full object-contain"
              unoptimized
            />
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setFiles([]);
            }}
            className="bg-destructive text-destructive-foreground absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full shadow-sm transition-transform hover:scale-110"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        <p className="text-muted-foreground text-[11px]">
          Click the &times; to remove and upload a new image.
        </p>
      </div>
    );
  }

  // No image — show FilePond uploader
  return (
    <div className="space-y-2">
      <label className="text-foreground text-sm font-medium">{label}</label>
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}

      <div className="filepond-wrapper max-w-sm [&_.filepond--root]:mb-0">
        <FilePond
          files={files.map((f) => f.file) as File[]}
          onupdatefiles={setFiles}
          allowMultiple={false}
          maxFiles={1}
          server={serverConfig}
          acceptedFileTypes={acceptedFileTypes}
          maxFileSize={maxFileSize}
          labelIdle='Drag & drop or <span class="filepond--label-action">Browse</span>'
          labelMaxFileSizeExceeded="File is too large"
          labelMaxFileSize={`Maximum file size is ${maxFileSize}`}
          imagePreviewHeight={previewHeight}
          {...(imageCropAspectRatio
            ? {
                imageCropAspectRatio,
                imageResizeTargetWidth: previewWidth,
                imageResizeMode: "contain" as const,
              }
            : {})}
          stylePanelLayout="compact"
          credits={false}
        />
      </div>
    </div>
  );
}
