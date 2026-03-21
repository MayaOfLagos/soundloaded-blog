"use client";

import { useState } from "react";
import Image from "next/image";
import {
  X,
  Save,
  Trash2,
  Loader2,
  Copy,
  Music,
  FileVideo,
  FileText,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import axios from "axios";

interface MediaItem {
  id: string;
  filename: string;
  r2Key: string;
  url: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string;
  title: string;
  caption: string;
  folder: string;
  type: "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT";
  createdAt: string;
  user?: { name: string | null; email: string } | null;
}

interface MediaDetailPanelProps {
  item: MediaItem;
  onClose: () => void;
  onDelete: () => void;
  onUpdate: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaDetailPanel({ item, onClose, onDelete, onUpdate }: MediaDetailPanelProps) {
  const [alt, setAlt] = useState(item.alt);
  const [title, setTitle] = useState(item.title);
  const [caption, setCaption] = useState(item.caption);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    try {
      await axios.patch(`/api/admin/media/${item.id}`, { alt, title, caption });
      toast.success("Updated");
      onUpdate();
    } catch {
      toast.error("Failed to update");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${item.filename}"? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/admin/media/${item.id}`);
      toast.success("Deleted");
      onDelete();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setIsDeleting(false);
    }
  }

  function copyUrl() {
    navigator.clipboard.writeText(item.url);
    toast.success("URL copied");
  }

  return (
    <div className="bg-card flex h-full w-80 shrink-0 flex-col overflow-y-auto border-l">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Details</h3>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground rounded-md p-1 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="border-b p-4">
        <div className="bg-muted overflow-hidden rounded-lg">
          {item.type === "IMAGE" ? (
            <Image
              src={item.url}
              alt={item.alt || item.filename}
              width={300}
              height={200}
              className="h-auto w-full object-contain"
              unoptimized
            />
          ) : item.type === "AUDIO" ? (
            <div className="flex flex-col items-center gap-3 p-6">
              <Music className="h-10 w-10 text-purple-400" />
              <audio controls className="w-full" src={item.url} preload="metadata" />
            </div>
          ) : item.type === "VIDEO" ? (
            <div className="flex flex-col items-center gap-3 p-6">
              <FileVideo className="h-10 w-10 text-blue-400" />
              <video controls className="w-full rounded" src={item.url} preload="metadata" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 p-6">
              <FileText className="h-10 w-10 text-amber-400" />
              <span className="text-muted-foreground text-xs">{item.filename}</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="space-y-1.5">
          <p className="truncate text-sm font-medium">{item.filename}</p>
          <div className="text-muted-foreground space-y-0.5 text-xs">
            <p>
              {item.mimeType} &middot; {formatFileSize(item.size)}
            </p>
            {item.width && item.height && (
              <p>
                {item.width} &times; {item.height}px
              </p>
            )}
            <p>{new Date(item.createdAt).toLocaleString()}</p>
            {item.user && <p>By {item.user.name || item.user.email}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">URL</Label>
          <div className="flex gap-1.5">
            <Input value={item.url} readOnly className="text-xs" />
            <Button variant="outline" size="icon" className="shrink-0" onClick={copyUrl}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() => window.open(item.url, "_blank")}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="media-title">
            Title
          </Label>
          <Input
            id="media-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="File title"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="media-alt">
            Alt Text
          </Label>
          <Input
            id="media-alt"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Describe this image for accessibility"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="media-caption">
            Caption
          </Label>
          <Textarea
            id="media-caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional caption"
            rows={2}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-brand hover:bg-brand/90 text-brand-foreground flex-1 gap-1.5"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}{" "}
            Save
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="gap-1.5"
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}{" "}
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
