"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, Check } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";

interface DownloadButtonProps {
  musicId: string;
  title: string;
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
  enabled?: boolean;
}

type State = "idle" | "loading" | "done" | "error";

export function DownloadButton({
  musicId,
  title,
  className,
  size = "sm",
  variant = "default",
  enabled = true,
}: DownloadButtonProps) {
  const [state, setState] = useState<State>("idle");
  const { data: settings } = useSettings();

  const downloadsGloballyEnabled = settings?.enableDownloads ?? true;
  const canDownload = downloadsGloballyEnabled && enabled;

  const handleDownload = async () => {
    if (!canDownload) {
      toast.error("Downloads are currently unavailable for this track.");
      return;
    }
    if (state !== "idle") return;

    setState("loading");
    const loadingToast = toast.loading(`Preparing download — ${title}...`);

    try {
      const res = await fetch(`/api/music/${musicId}/download`, { method: "POST" });

      if (res.status === 429) {
        const limit = settings?.maxDownloadsPerHour;
        toast.error(
          limit
            ? `Download limit reached (${limit}/hour). Try again later.`
            : "Download limit reached. Try again in 1 hour.",
          { id: loadingToast }
        );
        setState("idle");
        return;
      }

      if (res.status === 403) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(data?.error ?? "Downloads are currently unavailable.", { id: loadingToast });
        setState("idle");
        return;
      }

      if (!res.ok) throw new Error();

      const { url, filename } = await res.json();

      // Trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setState("done");
      toast.success(`⬇️ Downloading — ${title}`, { id: loadingToast, duration: 4000 });
      setTimeout(() => setState("idle"), 3000);
    } catch {
      setState("error");
      toast.error("Download failed. Please try again.", { id: loadingToast });
      setTimeout(() => setState("idle"), 2000);
    }
  };

  const icons: Record<State, React.ReactNode> = {
    idle: <Download className="h-3.5 w-3.5" />,
    loading: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    done: <Check className="h-3.5 w-3.5 text-green-500" />,
    error: <Download className="h-3.5 w-3.5" />,
  };

  const labels: Record<State, string> = {
    idle: "Download",
    loading: "Getting...",
    done: "Downloaded!",
    error: "Try again",
  };

  return (
    <motion.div whileTap={{ scale: 0.98 }} whileHover={{ y: -1 }}>
      <Button
        onClick={handleDownload}
        disabled={state === "loading" || !canDownload}
        size={size}
        variant={variant}
        className={cn(
          variant === "default" && "bg-brand hover:bg-brand/90 text-brand-foreground",
          "relative gap-1.5 overflow-hidden",
          className
        )}
        aria-label={`Download ${title}`}
      >
        <motion.span
          className="absolute inset-0 bg-white/10"
          initial={{ x: "-120%" }}
          animate={state === "loading" ? { x: ["-120%", "120%"] } : { x: "-120%" }}
          transition={{
            duration: 1.05,
            repeat: state === "loading" ? Infinity : 0,
            ease: "linear",
          }}
        />
        <span className="relative z-10 flex items-center gap-1.5">
          {icons[state]}
          <span>{canDownload ? labels[state] : "Unavailable"}</span>
        </span>
      </Button>
    </motion.div>
  );
}
