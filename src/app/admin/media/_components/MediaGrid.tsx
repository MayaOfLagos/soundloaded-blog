"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Music,
  FileVideo,
  FileText,
  ImageIcon,
  Check,
  Trash2,
  Loader2,
  Search,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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

interface MediaGridProps {
  items: MediaItem[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  search: string;
  typeFilter: string;
  onSearchChange: (v: string) => void;
  onTypeFilterChange: (v: string) => void;
  onPageChange: (p: number) => void;
  onSelect?: (item: MediaItem) => void;
  onRefresh: () => void;
  selectedId?: string | null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MediaTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "AUDIO":
      return <Music className="h-8 w-8 text-purple-400" />;
    case "VIDEO":
      return <FileVideo className="h-8 w-8 text-blue-400" />;
    case "DOCUMENT":
      return <FileText className="h-8 w-8 text-amber-400" />;
    default:
      return <ImageIcon className="h-8 w-8 text-emerald-400" />;
  }
}

export function MediaGrid({
  items,
  total,
  page,
  totalPages,
  isLoading,
  search,
  typeFilter,
  onSearchChange,
  onTypeFilterChange,
  onPageChange,
  onSelect,
  onRefresh,
  selectedId,
}: MediaGridProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  function toggleSelection(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    if (
      !confirm(
        `Delete ${selected.size} item${selected.size > 1 ? "s" : ""}? This cannot be undone.`
      )
    )
      return;

    setIsDeleting(true);
    try {
      await axios.post("/api/admin/media/bulk-delete", {
        ids: Array.from(selected),
      });
      toast.success(`${selected.size} item(s) deleted`);
      setSelected(new Set());
      onRefresh();
    } catch {
      toast.error("Delete failed");
    } finally {
      setIsDeleting(false);
    }
  }

  const TYPE_FILTERS = [
    { value: "", label: "All" },
    { value: "IMAGE", label: "Images" },
    { value: "AUDIO", label: "Audio" },
    { value: "VIDEO", label: "Video" },
    { value: "DOCUMENT", label: "Docs" },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search files..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-1 rounded-lg border p-0.5">
          {TYPE_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onTypeFilterChange(value)}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                typeFilter === value
                  ? "bg-brand text-white"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-1 rounded-lg border p-0.5">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              viewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground"
            )}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground"
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>

        {selected.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={isDeleting}
            className="gap-1.5"
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Delete {selected.size}
          </Button>
        )}
      </div>

      {/* Stats */}
      <p className="text-muted-foreground text-xs">
        {total} file{total !== 1 ? "s" : ""}
        {search && ` matching "${search}"`}
      </p>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ImageIcon className="text-muted-foreground/30 mb-3 h-12 w-12" />
          <p className="text-muted-foreground text-sm">No media files found</p>
          <p className="text-muted-foreground/60 mt-1 text-xs">Upload files using the Upload tab</p>
        </div>
      )}

      {/* Grid View */}
      {!isLoading && items.length > 0 && viewMode === "grid" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((item) => {
            const isSelected = selected.has(item.id);
            const isActive = selectedId === item.id;
            return (
              <div
                key={item.id}
                className={cn(
                  "group relative cursor-pointer overflow-hidden rounded-xl border transition-all",
                  isActive
                    ? "ring-brand border-brand ring-2"
                    : isSelected
                      ? "border-brand/50 ring-brand/30 ring-1"
                      : "hover:border-foreground/20"
                )}
                onClick={() => onSelect?.(item)}
              >
                {/* Selection checkbox */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelection(item.id);
                  }}
                  className={cn(
                    "absolute top-2 left-2 z-10 flex h-5 w-5 items-center justify-center rounded-md border transition-all",
                    isSelected
                      ? "bg-brand border-brand text-white"
                      : "border-white/50 bg-black/30 text-transparent opacity-0 group-hover:opacity-100"
                  )}
                >
                  <Check className="h-3 w-3" />
                </button>

                {/* Thumbnail */}
                <div className="bg-muted aspect-square">
                  {item.type === "IMAGE" ? (
                    <Image
                      src={item.url}
                      alt={item.alt || item.filename}
                      width={200}
                      height={200}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3">
                      <MediaTypeIcon type={item.type} />
                      <span className="text-muted-foreground max-w-full truncate text-[10px]">
                        {item.filename}
                      </span>
                    </div>
                  )}
                </div>

                {/* File info */}
                <div className="border-t p-2">
                  <p className="truncate text-xs font-medium">{item.title || item.filename}</p>
                  <p className="text-muted-foreground text-[10px]">{formatFileSize(item.size)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {!isLoading && items.length > 0 && viewMode === "list" && (
        <div className="divide-y rounded-xl border">
          {items.map((item) => {
            const isSelected = selected.has(item.id);
            const isActive = selectedId === item.id;
            return (
              <div
                key={item.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors",
                  isActive ? "bg-brand/5" : "hover:bg-muted/50"
                )}
                onClick={() => onSelect?.(item)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelection(item.id);
                  }}
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all",
                    isSelected ? "bg-brand border-brand text-white" : "border-border"
                  )}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </button>

                <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                  {item.type === "IMAGE" ? (
                    <Image
                      src={item.url}
                      alt={item.alt || item.filename}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <MediaTypeIcon type={item.type} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title || item.filename}</p>
                  <p className="text-muted-foreground text-xs">
                    {item.type.toLowerCase()} &middot; {formatFileSize(item.size)}
                    {item.width && item.height && ` \u00b7 ${item.width}\u00d7${item.height}`}
                  </p>
                </div>

                <span className="text-muted-foreground shrink-0 text-xs">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-muted-foreground text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
