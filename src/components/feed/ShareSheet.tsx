"use client";

import { useEffect, useState } from "react";
import { Link2, ExternalLink, Share2 } from "lucide-react";
import toast from "react-hot-toast";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ShareSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postUrl: string;
  postTitle: string;
}

const SHARE_OPTIONS = [
  { id: "copy", label: "Copy link", icon: Link2 },
  { id: "external", label: "Share externally", icon: ExternalLink },
  { id: "whatsapp", label: "Share to WhatsApp", icon: Share2 },
  { id: "twitter", label: "Share to X (Twitter)", icon: Share2 },
] as const;

export function ShareSheet({ open, onOpenChange, postUrl, postTitle }: ShareSheetProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleAction = async (id: string) => {
    const fullUrl = postUrl.startsWith("http") ? postUrl : `${window.location.origin}${postUrl}`;

    switch (id) {
      case "copy":
        try {
          await navigator.clipboard.writeText(fullUrl);
          toast.success("Link copied!");
        } catch {
          toast.error("Could not copy link");
        }
        break;
      case "external":
        if (navigator.share) {
          try {
            await navigator.share({ title: postTitle, url: fullUrl });
          } catch {
            /* cancelled */
          }
        } else {
          await navigator.clipboard.writeText(fullUrl);
          toast.success("Link copied!");
        }
        break;
      case "whatsapp":
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`${postTitle} ${fullUrl}`)}`,
          "_blank",
          "noopener"
        );
        break;
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(postTitle)}`,
          "_blank",
          "noopener"
        );
        break;
    }

    onOpenChange(false);
  };

  const content = (
    <div className="flex flex-col gap-1 py-2">
      {SHARE_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => handleAction(option.id)}
          className="text-foreground hover:bg-muted flex w-full items-center gap-3 rounded-lg px-4 py-3 text-[15px] font-medium transition-colors"
        >
          <option.icon className="text-muted-foreground h-5 w-5" />
          {option.label}
        </button>
      ))}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Share post</DrawerTitle>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Share post</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
