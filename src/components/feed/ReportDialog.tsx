"use client";

import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useFileReport } from "@/hooks/useReports";
import { cn } from "@/lib/utils";

const REPORT_REASONS = [
  { value: "spam", label: "Spam", description: "Misleading or repetitive content" },
  { value: "harassment", label: "Harassment", description: "Bullying or targeting an individual" },
  {
    value: "misinformation",
    label: "Misinformation",
    description: "False or misleading information",
  },
  {
    value: "hate_speech",
    label: "Hate speech",
    description: "Attacks based on identity or vulnerability",
  },
  { value: "violence", label: "Violence", description: "Threats of violence or dangerous content" },
  { value: "other", label: "Other", description: "Something else not listed above" },
] as const;

interface ReportDialogProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportDialog({ postId, open, onOpenChange }: ReportDialogProps) {
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const fileReport = useFileReport();

  const handleSubmit = () => {
    if (!reason) return;
    fileReport.mutate(
      { postId, reason, details: details.trim() || undefined },
      {
        onSuccess: () => {
          setReason("");
          setDetails("");
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-500" />
            Report post
          </DialogTitle>
          <DialogDescription>
            Help us understand the problem. We won&apos;t let the author know who reported this.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <p className="text-foreground text-sm font-medium">Why are you reporting this post?</p>
          <div className="space-y-1.5">
            {REPORT_REASONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setReason(r.value)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                  reason === r.value ? "bg-brand/10 ring-brand/40 ring-1" : "hover:bg-muted/60"
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    reason === r.value ? "border-brand bg-brand" : "border-muted-foreground/40"
                  )}
                >
                  {reason === r.value && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <p className="text-foreground text-sm font-medium">{r.label}</p>
                  <p className="text-muted-foreground text-xs">{r.description}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="pt-1">
            <label className="text-foreground mb-1.5 block text-sm font-medium">
              Additional details <span className="text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide more context about why you're reporting this post…"
              maxLength={1000}
              rows={3}
              className="resize-none"
            />
            <p className="text-muted-foreground mt-1 text-right text-xs">{details.length}/1000</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!reason || fileReport.isPending}
          >
            {fileReport.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              "Submit report"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
