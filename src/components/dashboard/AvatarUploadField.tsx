"use client";

import { useState, useMemo } from "react";
import { Camera } from "lucide-react";
import axios from "axios";
import { notify } from "@/hooks/useToast";

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

interface AvatarUploadFieldProps {
  onUploaded: (url: string) => void;
}

export function AvatarUploadField({ onUploaded }: AvatarUploadFieldProps) {
  const [files, setFiles] = useState<FilePondFile[]>([]);

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
            // 1. Get presigned URL from user avatar upload API
            const { data } = await axios.post("/api/user/upload-avatar", {
              filename: f.name,
              contentType: f.type,
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
                onUploaded(data.url);
                load(data.url);
              } else {
                error("Upload failed");
                notify.error("Upload failed");
              }
            };

            xhr.onerror = () => {
              error("Upload failed");
              notify.error("Upload failed");
            };

            controller.signal.addEventListener("abort", () => {
              xhr.abort();
            });

            xhr.send(f);
          } catch {
            error("Upload failed");
            notify.error("Upload failed");
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
    [onUploaded]
  );

  return (
    <div className="space-y-2">
      <div className="text-muted-foreground flex items-center gap-2">
        <Camera className="h-4 w-4" />
        <p className="text-foreground text-sm font-medium">Upload Photo</p>
      </div>
      <p className="text-muted-foreground text-xs">PNG, JPEG, or WebP. Max 5MB.</p>
      <div className="filepond-wrapper max-w-sm [&_.filepond--root]:mb-0">
        <FilePond
          files={files.map((f) => f.file) as File[]}
          onupdatefiles={setFiles}
          allowMultiple={false}
          maxFiles={1}
          server={serverConfig}
          acceptedFileTypes={["image/png", "image/jpeg", "image/webp"]}
          maxFileSize="5MB"
          labelIdle='Drag & drop or <span class="filepond--label-action">Browse</span>'
          labelMaxFileSizeExceeded="File is too large"
          labelMaxFileSize="Maximum file size is 5MB"
          imagePreviewHeight={120}
          imageCropAspectRatio="1:1"
          imageResizeTargetWidth={400}
          imageResizeMode={"contain" as const}
          stylePanelLayout="compact"
          credits={false}
        />
      </div>
    </div>
  );
}
