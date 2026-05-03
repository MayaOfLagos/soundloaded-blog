"use client";

import Link from "next/link";
import Image from "next/image";
import { ExternalLink, BarChart2, Edit2, Trash2, Globe, QrCode, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export type FanlinkCardData = {
  id: string;
  slug: string;
  title: string;
  artistName: string;
  type: string;
  coverArt?: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SUSPENDED";
  totalClicks: number;
  uniqueVisitors: number;
  createdAt: string;
  _count?: { emails: number };
};

const STATUS_STYLES = {
  DRAFT: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  PUBLISHED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  ARCHIVED: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  SUSPENDED: "bg-red-500/15 text-red-400 border-red-500/20",
};

type Props = {
  fanlink: FanlinkCardData;
  onDeleted?: (id: string) => void;
};

export function FanlinkCard({ fanlink, onDeleted }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const [downloadingQr, setDownloadingQr] = useState(false);
  const [showQrPreview, setShowQrPreview] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${fanlink.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/fanlinks/${fanlink.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`"${fanlink.title}" deleted`);
        onDeleted?.(fanlink.id);
        router.refresh();
      } else {
        toast.error("Delete failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setDeleting(false);
    }
  };

  const handleQrDownload = async () => {
    setDownloadingQr(true);
    try {
      const res = await fetch(`/api/fanlink/${fanlink.slug}/qr?size=600`);
      if (!res.ok) {
        toast.error("QR generation failed");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fanlink-${fanlink.slug}-qr.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("QR download failed");
    } finally {
      setDownloadingQr(false);
    }
  };

  return (
    <div className="bg-card/60 ring-border/40 hover:ring-border/70 rounded-2xl ring-1 backdrop-blur-sm transition-all">
      <div className="flex items-center gap-4 p-4">
        {/* Cover */}
        <div className="bg-muted relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl">
          {fanlink.coverArt ? (
            <Image
              src={fanlink.coverArt}
              alt={fanlink.title}
              fill
              className="object-cover"
              sizes="56px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Globe className="text-muted-foreground h-6 w-6" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-foreground truncate text-sm font-bold">{fanlink.title}</p>
            <Badge
              variant="outline"
              className={cn("border px-2 py-0.5 text-[10px]", STATUS_STYLES[fanlink.status])}
            >
              {fanlink.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-0.5 truncate text-xs">{fanlink.artistName}</p>
          <div className="mt-1.5 flex items-center gap-3">
            <span className="text-muted-foreground/70 text-[11px]">
              {fanlink.totalClicks.toLocaleString()} clicks
            </span>
            <span className="text-muted-foreground/40 text-[10px]">•</span>
            <span className="text-muted-foreground/70 text-[11px]">
              {fanlink.uniqueVisitors.toLocaleString()} visitors
            </span>
            {(fanlink._count?.emails ?? 0) > 0 && (
              <>
                <span className="text-muted-foreground/40 text-[10px]">•</span>
                <span className="text-muted-foreground/70 text-[11px]">
                  {fanlink._count!.emails} emails
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-shrink-0 items-center gap-1.5">
          {fanlink.status === "PUBLISHED" && (
            <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="View live">
              <Link href={`/fanlink/${fanlink.slug}`} target="_blank">
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
          {fanlink.status === "PUBLISHED" && (
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", showQrPreview && "bg-accent")}
              title={showQrPreview ? "Hide QR code" : "Show QR code"}
              onClick={() => setShowQrPreview((v) => !v)}
              disabled={downloadingQr}
            >
              {downloadingQr ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <QrCode className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
          <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Analytics">
            <Link href={`/dashboard/fanlinks/${fanlink.id}/analytics`}>
              <BarChart2 className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Edit"
            disabled={fanlink.status === "SUSPENDED"}
          >
            <Link href={`/dashboard/fanlinks/${fanlink.id}/edit`}>
              <Edit2 className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-red-500/10 hover:text-red-500"
            title="Delete"
            onClick={handleDelete}
            disabled={deleting || fanlink.status === "SUSPENDED"}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* QR inline preview */}
      {showQrPreview && fanlink.status === "PUBLISHED" && (
        <div className="border-border/40 flex flex-col items-center gap-3 border-t px-4 pt-3 pb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/fanlink/${fanlink.slug}/qr?size=200`}
            alt={`QR code for ${fanlink.title}`}
            width={200}
            height={200}
            className="rounded-xl"
          />
          <button
            onClick={handleQrDownload}
            disabled={downloadingQr}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs transition-colors"
          >
            {downloadingQr ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <QrCode className="h-3 w-3" />
            )}
            Download PNG
          </button>
        </div>
      )}
    </div>
  );
}
