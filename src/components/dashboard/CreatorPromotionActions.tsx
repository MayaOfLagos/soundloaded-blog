"use client";

import { Copy, ExternalLink, ImageIcon, Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { notify } from "@/hooks/useToast";

type CreatorPromotionActionsProps = {
  url: string;
  caption: string;
  imageUrl: string;
};

function fallbackCopy(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    if (!document.execCommand("copy")) {
      throw new Error("Copy command rejected");
    }
  } finally {
    document.body.removeChild(textarea);
  }
}

async function copyText(value: string, successMessage: string) {
  try {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        fallbackCopy(value);
      }
    } else {
      fallbackCopy(value);
    }

    notify.success(successMessage);
  } catch {
    notify.error("Could not copy right now");
  }
}

export function CreatorPromotionActions({ url, caption, imageUrl }: CreatorPromotionActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 px-2.5 text-xs"
        onClick={() => copyText(url, "Release link copied")}
      >
        <Link2 className="h-3.5 w-3.5" />
        Link
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 px-2.5 text-xs"
        onClick={() => copyText(caption, "Caption copied")}
      >
        <Copy className="h-3.5 w-3.5" />
        Caption
      </Button>
      <Button asChild size="sm" variant="secondary" className="h-8 px-2.5 text-xs">
        <a href={imageUrl} target="_blank" rel="noopener noreferrer">
          <ImageIcon className="h-3.5 w-3.5" />
          Asset
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </Button>
    </div>
  );
}
