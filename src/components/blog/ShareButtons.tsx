"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";
import { FaWhatsapp, FaTwitter, FaFacebook, FaTelegram } from "react-icons/fa";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

interface ShareButtonsProps {
  url: string;
  title: string;
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = [
    {
      label: "WhatsApp",
      icon: FaWhatsapp,
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      color: "hover:text-green-500",
    },
    {
      label: "Twitter/X",
      icon: FaTwitter,
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}&via=soundloadedng`,
      color: "hover:text-sky-400",
    },
    {
      label: "Facebook",
      icon: FaFacebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "hover:text-blue-500",
    },
    {
      label: "Telegram",
      icon: FaTelegram,
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      color: "hover:text-sky-500",
    },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground mr-1 text-sm font-medium">Share:</span>

      {shareLinks.map(({ label, icon: Icon, href, color }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${label}`}
          className={`border-border text-muted-foreground flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${color} hover:bg-muted hover:border-current`}
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={copyLink}
        className="h-9 gap-2"
        aria-label="Copy link"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Link2 className="h-3.5 w-3.5" />
        )}
        {copied ? "Copied!" : "Copy Link"}
      </Button>
    </div>
  );
}
