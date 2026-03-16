"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { X, Check, Loader2, Upload, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MediaGrid, type MediaItem } from "./MediaGrid";
import { UppyUploader } from "./UppyUploader";
import { useDebounce } from "@/hooks/useDebounce";

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (media: MediaItem | MediaItem[]) => void;
  multiple?: boolean;
  allowedTypes?: ("IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT")[];
  maxFiles?: number;
}

export function MediaPickerModal({
  open,
  onClose,
  onSelect,
  multiple = false,
  allowedTypes,
  maxFiles = 1,
}: MediaPickerModalProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(allowedTypes?.length === 1 ? allowedTypes[0] : "");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<MediaItem[]>([]);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["picker-media", debouncedSearch, typeFilter, page],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "30");
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (typeFilter) params.set("type", typeFilter);
      return axios.get(`/api/admin/media?${params}`).then((r) => r.data);
    },
    enabled: open,
  });

  const handleItemSelect = useCallback(
    (item: MediaItem) => {
      if (multiple) {
        setSelected((prev) => {
          const exists = prev.find((i) => i.id === item.id);
          if (exists) return prev.filter((i) => i.id !== item.id);
          if (prev.length >= maxFiles) return prev;
          return [...prev, item];
        });
      } else {
        setSelected([item]);
      }
    },
    [multiple, maxFiles]
  );

  function handleConfirm() {
    if (selected.length === 0) return;
    onSelect(multiple ? selected : selected[0]);
    onClose();
  }

  const handleUploadComplete = useCallback(() => {
    refetch();
  }, [refetch]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="bg-card relative mx-4 flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-3.5">
          <h2 className="text-base font-bold">
            {multiple ? "Select Media Files" : "Select Media"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-md p-1 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <Tabs defaultValue="library" className="space-y-4">
            <TabsList className="bg-muted inline-flex h-9 rounded-lg p-0.5">
              <TabsTrigger value="library" className="gap-1.5 rounded-md px-3 text-sm">
                <ImageIcon className="h-3.5 w-3.5" />
                Library
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-1.5 rounded-md px-3 text-sm">
                <Upload className="h-3.5 w-3.5" />
                Upload New
              </TabsTrigger>
            </TabsList>

            <TabsContent value="library" className="mt-0">
              {isLoading && !data ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
                </div>
              ) : (
                <MediaGrid
                  items={data?.items ?? []}
                  total={data?.total ?? 0}
                  page={data?.page ?? 1}
                  totalPages={data?.totalPages ?? 1}
                  isLoading={isLoading}
                  search={search}
                  typeFilter={typeFilter}
                  onSearchChange={(v) => {
                    setSearch(v);
                    setPage(1);
                  }}
                  onTypeFilterChange={(v) => {
                    setTypeFilter(v);
                    setPage(1);
                  }}
                  onPageChange={setPage}
                  onSelect={handleItemSelect}
                  onRefresh={() => refetch()}
                  selectedId={selected[0]?.id}
                />
              )}
            </TabsContent>

            <TabsContent value="upload" className="mt-0">
              <UppyUploader onUploadComplete={handleUploadComplete} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-5 py-3">
          <p className="text-muted-foreground text-sm">
            {selected.length > 0
              ? `${selected.length} file${selected.length > 1 ? "s" : ""} selected`
              : "No file selected"}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={selected.length === 0}
              className="bg-brand hover:bg-brand/90 text-brand-foreground gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              {multiple ? "Insert Selected" : "Select"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
