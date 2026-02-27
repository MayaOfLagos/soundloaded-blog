"use client";

import { useState } from "react";
import { Download, Loader2, Check } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DownloadButtonProps {
  musicId: string;
  title: string;
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
}

type State = "idle" | "loading" | "done" | "error";

export function DownloadButton({
  musicId,
  title,
  className,
  size = "sm",
  variant = "default",
}: DownloadButtonProps) {
  const [state, setState] = useState<State>("idle");

  const handleDownload = async () => {
    if (state !== "idle") return;

    setState("loading");
    const loadingToast = toast.loading(`Preparing download — ${title}...`);

    try {
      const res = await fetch(`/api/music/${musicId}/download`, { method: "POST" });

      if (res.status === 429) {
        toast.error("Download limit reached. Try again in 1 hour.", { id: loadingToast });
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
    <Button
      onClick={handleDownload}
      disabled={state === "loading"}
      size={size}
      variant={variant}
      className={cn(
        variant === "default" && "bg-brand hover:bg-brand/90 text-brand-foreground",
        "gap-1.5",
        className
      )}
      aria-label={`Download ${title}`}
    >
      {icons[state]}
      <span>{labels[state]}</span>
    </Button>
  );
}
