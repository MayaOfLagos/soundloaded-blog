"use client";

import { useState, useRef, useEffect } from "react";
import { Share2, Copy, MessageCircle } from "lucide-react";
import { notify } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import { trackShareClick, type ShareTrackingInput } from "@/lib/client/creator-events";

interface ShareButtonProps {
  title: string;
  artist: string;
  url: string;
  size?: number;
  className?: string;
  tracking?: ShareTrackingInput;
}

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export function ShareButton({
  title,
  artist,
  url,
  size = 20,
  className,
  tracking,
}: ShareButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const shareText = `Listen to ${title} by ${artist} on Soundloaded\n${url}`;
  const trackShare = (shareChannel: ShareTrackingInput["shareChannel"]) => {
    if (!tracking) return;
    trackShareClick({ ...tracking, shareChannel, href: tracking.href ?? url });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        // Only pass title + url — passing both text and url duplicates the link on some devices
        await navigator.share({ title: `${title} — ${artist}`, url });
        trackShare("native");
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Native share failed — fall back to dropdown
        setShowDropdown((prev) => !prev);
      }
      return;
    }
    setShowDropdown((prev) => !prev);
  };

  const handleWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      "_blank",
      "noopener,noreferrer"
    );
    trackShare("whatsapp");
    setShowDropdown(false);
  };

  const handleTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      "_blank",
      "noopener,noreferrer"
    );
    trackShare("x");
    setShowDropdown(false);
  };

  const handleCopy = async () => {
    try {
      // clipboard.writeText can fail on mobile without secure context
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback: hidden textarea + execCommand
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      notify.success("Link copied!");
      trackShare("copy");
    } catch {
      notify.error("Failed to copy link");
    }
    setShowDropdown(false);
  };

  // Close on click outside
  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDropdown]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleShare}
        className={cn(
          "bg-muted hover:bg-muted/80 flex items-center justify-center rounded-full p-2.5 transition-colors",
          className
        )}
        aria-label="Share"
      >
        <Share2 size={size} className="text-foreground" />
      </button>

      {showDropdown && (
        <div className="border-border bg-popover absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 rounded-xl border p-1.5 shadow-lg">
          <button
            type="button"
            onClick={handleWhatsApp}
            className="text-foreground hover:bg-muted flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
          >
            <MessageCircle className="h-4 w-4 text-green-500" />
            WhatsApp
          </button>
          <button
            type="button"
            onClick={handleTwitter}
            className="text-foreground hover:bg-muted flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
          >
            <XIcon className="h-4 w-4" />X (Twitter)
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="text-foreground hover:bg-muted flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
          >
            <Copy className="h-4 w-4" />
            Copy Link
          </button>
        </div>
      )}
    </div>
  );
}
