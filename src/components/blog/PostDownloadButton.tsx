"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, Check } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PostDownloadButtonProps {
  postId: string;
  title: string;
  label?: string | null;
  className?: string;
}

type State = "idle" | "loading" | "done" | "error";

export function PostDownloadButton({ postId, title, label, className }: PostDownloadButtonProps) {
  const [state, setState] = useState<State>("idle");

  const handleDownload = async () => {
    if (state === "loading") return;

    setState("loading");
    const loadingToast = toast.loading(`Preparing download — ${title}...`);

    try {
      const res = await fetch(`/api/downloads/posts/${postId}`, { method: "POST" });

      if (res.status === 429) {
        toast.error("Download limit reached. Try again later.", { id: loadingToast });
        setState("idle");
        return;
      }

      if (res.status === 403) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(data?.error ?? "This download is not available.", { id: loadingToast });
        setState("idle");
        return;
      }

      if (!res.ok) throw new Error();

      const { url, filename } = await res.json();
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setState("done");
      toast.success(`⬇️ Downloading — ${title}`, { id: loadingToast, duration: 4000 });
      setTimeout(() => setState("idle"), 2200);
    } catch {
      setState("error");
      toast.error("Download failed. Please try again.", { id: loadingToast });
      setTimeout(() => setState("idle"), 1800);
    }
  };

  const icon =
    state === "loading" ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : state === "done" ? (
      <Check className="h-4 w-4" />
    ) : (
      <Download className="h-4 w-4" />
    );

  const text =
    state === "loading"
      ? "Getting file..."
      : state === "done"
        ? "Ready"
        : state === "error"
          ? "Try again"
          : (label ?? "Download file");

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -1 }}
      className={cn("w-full", className)}
    >
      <Button
        type="button"
        size="lg"
        onClick={handleDownload}
        disabled={state === "loading"}
        className={cn(
          "bg-brand hover:bg-brand/90 text-brand-foreground relative w-full gap-2 overflow-hidden rounded-xl px-4 py-6 font-semibold shadow-lg"
        )}
      >
        <motion.span
          className="absolute inset-0 bg-white/10"
          initial={{ x: "-120%" }}
          animate={state === "loading" ? { x: ["-120%", "120%"] } : { x: "-120%" }}
          transition={{ duration: 1.1, repeat: state === "loading" ? Infinity : 0, ease: "linear" }}
        />
        <span className="relative z-10 flex items-center gap-2">
          {icon}
          <span>{text}</span>
        </span>
      </Button>
    </motion.div>
  );
}
