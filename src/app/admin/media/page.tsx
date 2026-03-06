"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { ImageIcon, Upload, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UppyUploader } from "./_components/UppyUploader";
import { MediaGrid } from "./_components/MediaGrid";
import { MediaDetailPanel } from "./_components/MediaDetailPanel";
import { useDebounce } from "@/hooks/useDebounce";

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

export default function MediaLibraryPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-media", debouncedSearch, typeFilter, page],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "40");
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (typeFilter) params.set("type", typeFilter);
      return axios.get(`/api/admin/media?${params}`).then((r) => r.data);
    },
  });

  const handleUploadComplete = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleSearchChange = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);

  const handleTypeFilterChange = useCallback((v: string) => {
    setTypeFilter(v);
    setPage(1);
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-brand/10 flex h-10 w-10 items-center justify-center rounded-xl">
          <ImageIcon className="text-brand h-5 w-5" />
        </div>
        <div>
          <h1 className="text-foreground text-2xl font-black">Media Library</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Upload and manage images, audio, and video files
          </p>
        </div>
      </div>

      {/* Tabs: Library / Upload */}
      <Tabs defaultValue="library" className="space-y-4">
        <TabsList className="bg-muted inline-flex h-10 rounded-lg p-1">
          <TabsTrigger value="library" className="gap-2 rounded-md px-4">
            <ImageIcon className="h-4 w-4" />
            Library
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2 rounded-md px-4">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="mt-0">
          <div className="flex">
            {/* Main grid */}
            <div className="flex-1">
              {isLoading && !data ? (
                <div className="flex justify-center py-20">
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
                  onSearchChange={handleSearchChange}
                  onTypeFilterChange={handleTypeFilterChange}
                  onPageChange={setPage}
                  onSelect={setSelectedItem}
                  onRefresh={() => refetch()}
                  selectedId={selectedItem?.id}
                />
              )}
            </div>

            {/* Detail panel */}
            {selectedItem && (
              <MediaDetailPanel
                key={selectedItem.id}
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
                onDelete={() => {
                  setSelectedItem(null);
                  refetch();
                }}
                onUpdate={() => refetch()}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="upload" className="mt-0">
          <div className="bg-card rounded-xl border p-6">
            <UppyUploader onUploadComplete={handleUploadComplete} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
