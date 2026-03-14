import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { notify } from "@/hooks/useToast";

interface UploadResult {
  url: string;
  key: string;
}

type MediaType = "image" | "video" | "audio";

function resolveMediaType(mimeType: string): MediaType {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "image";
}

/**
 * Generic media upload hook — uploads a file to /api/stories/upload (R2).
 * Re-uses the same server endpoint as story uploads since it accepts
 * image, video, and audio files with the same logic.
 */
export function useUploadMedia() {
  const [progress, setProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: async ({
      file,
      mediaType,
      purpose = "posts",
    }: {
      file: File;
      mediaType?: MediaType;
      purpose?: "posts" | "stories";
    }) => {
      setProgress(0);

      const resolvedType = mediaType ?? resolveMediaType(file.type);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("mediaType", resolvedType);
      formData.append("purpose", purpose);

      const { data } = await axios.post<UploadResult>("/api/stories/upload", formData, {
        onUploadProgress: (e) => {
          if (e.total) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        },
      });

      setProgress(100);
      return {
        url: data.url,
        key: data.key,
        type: resolvedType.toUpperCase() as "IMAGE" | "VIDEO" | "AUDIO",
        mimeType: file.type,
      };
    },
    onError: () => {
      setProgress(0);
      notify.error("Failed to upload file");
    },
  });

  return { ...mutation, progress };
}
