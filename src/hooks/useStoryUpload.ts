import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { notify } from "@/hooks/useToast";

interface UploadResult {
  uploadUrl: string;
  url: string;
  key: string;
}

export function useStoryUpload() {
  const [progress, setProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: async ({
      file,
      mediaType,
    }: {
      file: File;
      mediaType: "image" | "video" | "audio";
    }) => {
      setProgress(0);

      // 1. Get presigned URL
      const { data } = await axios.post<UploadResult>("/api/stories/upload", {
        filename: file.name,
        contentType: file.type,
        mediaType,
      });

      // 2. Upload to R2
      await axios.put(data.uploadUrl, file, {
        headers: { "Content-Type": file.type },
        onUploadProgress: (e) => {
          if (e.total) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        },
      });

      setProgress(100);
      return { url: data.url, key: data.key };
    },
    onError: () => {
      setProgress(0);
      notify.error("Failed to upload file");
    },
  });

  return { ...mutation, progress };
}
