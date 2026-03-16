"use client";

import { useState } from "react";
import { Check, Copy, Code } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface EmbedDialogProps {
  postHref: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmbedDialog({ postHref, open, onOpenChange }: EmbedDialogProps) {
  const [copied, setCopied] = useState(false);

  const embedCode = `<iframe
  src="${typeof window !== "undefined" ? window.location.origin : ""}${postHref}"
  width="100%"
  height="500"
  frameborder="0"
  style="border: 1px solid #e5e7eb; border-radius: 12px;"
  allowfullscreen
></iframe>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement("textarea");
      textarea.value = embedCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="text-brand h-5 w-5" />
            Embed post
          </DialogTitle>
          <DialogDescription>
            Copy the code below and paste it into your website&apos;s HTML.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mt-2">
          <pre className="bg-muted/60 border-border scrollbar-hide overflow-x-auto rounded-xl border p-4 text-sm leading-relaxed">
            <code className="text-foreground/80 font-mono text-xs break-all whitespace-pre-wrap">
              {embedCode}
            </code>
          </pre>

          <Button
            size="sm"
            variant={copied ? "default" : "secondary"}
            onClick={handleCopy}
            className="absolute top-3 right-3"
          >
            {copied ? (
              <>
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Copy
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
