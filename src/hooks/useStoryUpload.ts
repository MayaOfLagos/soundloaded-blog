import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { notify } from "@/hooks/useToast";

interface UploadResult {
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

      const formData = new FormData();
      formData.append("file", file);
      formData.append("mediaType", mediaType);

      const { data } = await axios.post<UploadResult>("/api/stories/upload", formData, {
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
