"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { adminApi, getApiError } from "@/lib/admin-api";
import { Check, X, Loader2, ExternalLink, Music, Building2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

type Application = {
  id: string;
  type: "ARTIST" | "LABEL";
  status: "PENDING" | "APPROVED" | "REJECTED";
  displayName: string;
  slug: string;
  bio: string | null;
  genre: string | null;
  country: string | null;
  photo: string | null;
  socialLinks: Record<string, string> | null;
  proofUrls: string[] | null;
  reviewNote: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    username: string | null;
  };
};

export function ApplicationReviewDialog({
  application,
  open,
  onClose,
}: {
  application: Application;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [reviewNote, setReviewNote] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  async function handleReview(status: "APPROVED" | "REJECTED") {
    const setter = status === "APPROVED" ? setIsApproving : setIsRejecting;
    setter(true);

    try {
      await adminApi.put(`/api/admin/creators/${application.id}`, {
        status,
        reviewNote: reviewNote || null,
      });

      toast.success(status === "APPROVED" ? "Application approved!" : "Application rejected.");
      onClose();
      router.refresh();
    } catch (err) {
      toast.error(getApiError(err, "Failed to review application"));
    } finally {
      setter(false);
    }
  }

  const socialLinks = application.socialLinks ?? {};
  const socialEntries = Object.entries(socialLinks).filter(([, v]) => v);
  const isPending = application.status === "PENDING";

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {application.type === "ARTIST" ? (
              <Music className="text-brand h-5 w-5" />
            ) : (
              <Building2 className="text-brand h-5 w-5" />
            )}
            {application.displayName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Applicant info */}
          <div className="bg-muted/50 rounded-xl p-3">
            <p className="text-foreground text-sm font-medium">
              {application.user.name ?? "Unknown User"}
            </p>
            <p className="text-muted-foreground text-xs">{application.user.email}</p>
          </div>

          {/* Details */}
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <Badge variant="outline" className="text-[10px]">
                {application.type}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slug</span>
              <span className="text-foreground font-mono text-xs">{application.slug}</span>
            </div>
            {application.genre && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Genre</span>
                <span className="text-foreground">{application.genre}</span>
              </div>
            )}
            {application.country && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Country</span>
                <span className="text-foreground">{application.country}</span>
              </div>
            )}
          </div>

          {/* Bio */}
          {application.bio && (
            <div>
              <p className="text-muted-foreground mb-1 text-xs font-medium">Bio</p>
              <p className="text-foreground text-sm">{application.bio}</p>
            </div>
          )}

          {/* Social Links */}
          {socialEntries.length > 0 && (
            <div>
              <p className="text-muted-foreground mb-2 text-xs font-medium">Social Links</p>
              <div className="flex flex-wrap gap-2">
                {socialEntries.map(([key, value]) => (
                  <Badge key={key} variant="outline" className="gap-1 text-[10px]">
                    {key}: {value}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Proof URLs */}
          {application.proofUrls && application.proofUrls.length > 0 && (
            <div>
              <p className="text-muted-foreground mb-2 text-xs font-medium">Proof Links</p>
              <div className="space-y-1.5">
                {application.proofUrls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand flex items-center gap-1 text-xs hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {url}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Review Note (if already reviewed) */}
          {application.reviewNote && !isPending && (
            <div className="bg-muted/50 rounded-xl p-3">
              <p className="text-muted-foreground text-xs font-medium">Review Note</p>
              <p className="text-foreground mt-1 text-sm">{application.reviewNote}</p>
            </div>
          )}

          {/* Review Actions (only for pending) */}
          {isPending && (
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label>Review Note (optional)</Label>
                <Textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Add a note for the applicant..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleReview("APPROVED")}
                  disabled={isApproving || isRejecting}
                  className="flex-1 gap-1.5 bg-green-600 hover:bg-green-700"
                >
                  {isApproving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReview("REJECTED")}
                  disabled={isApproving || isRejecting}
                  className="flex-1 gap-1.5"
                >
                  {isRejecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  Reject
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
