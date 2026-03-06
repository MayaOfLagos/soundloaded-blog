"use client";

import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaPickerModal } from "./MediaPickerModal";

interface MediaItem {
  id: string;
  filename: string;
  r2Key: string;
  url: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string;
  title: string;
  caption: string;
  folder: string;
  type: "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT";
  createdAt: string;
}

interface MediaPickerButtonProps {
  onSelect: (media: MediaItem | MediaItem[]) => void;
  multiple?: boolean;
  allowedTypes?: ("IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT")[];
  maxFiles?: number;
  label?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function MediaPickerButton({
  onSelect,
  multiple = false,
  allowedTypes,
  maxFiles = 1,
  label = "Add Media",
  variant = "outline",
  size = "sm",
  className,
}: MediaPickerButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
        <ImagePlus className="mr-1.5 h-4 w-4" />
        {label}
      </Button>

      <MediaPickerModal
        open={open}
        onClose={() => setOpen(false)}
        onSelect={onSelect}
        multiple={multiple}
        allowedTypes={allowedTypes}
        maxFiles={maxFiles}
      />
    </>
  );
}
