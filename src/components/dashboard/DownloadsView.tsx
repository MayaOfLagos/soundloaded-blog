"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Download, Music } from "lucide-react";
import { useUserDownloads } from "@/hooks/useUserDashboard";
import { useUserStats } from "@/hooks/useUserDashboard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import axios from "axios";

// ── Component ───────────────────────────────────────────────────────────

export function DownloadsView() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useUserDownloads(page);
  const { data: stats, isLoading: statsLoading } = useUserStats();

  const handleRedownload = async (musicId: string) => {
    try {
      const { data } = await axios.post(`/api/music/${musicId}/download`);
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch {
      // Error handled silently — toast from mutation hook if wired
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card/50 ring-border/40 rounded-2xl p-4 ring-1 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="bg-brand/10 flex h-10 w-10 items-center justify-center rounded-xl">
              <Download className="text-brand h-5 w-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Total Downloads</p>
              {statsLoading ? (
                <Skeleton className="mt-1 h-6 w-12" />
              ) : (
                <p className="text-foreground text-xl font-black">{stats?.totalDownloads ?? 0}</p>
              )}
            </div>
          </div>
        </div>
        <div className="bg-card/50 ring-border/40 rounded-2xl p-4 ring-1 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="bg-brand/10 flex h-10 w-10 items-center justify-center rounded-xl">
              <Download className="text-brand h-5 w-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">This Month</p>
              {statsLoading ? (
                <Skeleton className="mt-1 h-6 w-12" />
              ) : (
                <p className="text-foreground text-xl font-black">{stats?.monthDownloads ?? 0}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Downloads Table */}
      <div className="bg-card/50 ring-border/40 rounded-2xl ring-1 backdrop-blur-sm">
        {isLoading ? (
          <div className="space-y-0 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="border-border/40 flex items-center gap-4 border-b py-3 last:border-0"
              >
                <Skeleton className="h-10 w-10 shrink-0 rounded" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        ) : !data?.downloads?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Music className="text-muted-foreground/50 mb-4 h-12 w-12" />
            <h3 className="text-lg font-medium">No downloads yet</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Start exploring music to build your download history.
            </p>
            <Button asChild className="mt-4" variant="outline">
              <Link href="/music">Browse Music</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14" />
                    <TableHead>Track</TableHead>
                    <TableHead>Artist</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.downloads.map(
                    (dl: {
                      id: string;
                      musicId: string;
                      createdAt: string;
                      music?: { coverImage?: string; title?: string; artist?: { name?: string } };
                    }) => (
                      <TableRow key={dl.id}>
                        <TableCell>
                          {dl.music?.coverImage ? (
                            <Image
                              src={dl.music.coverImage}
                              alt={dl.music.title ?? "Cover"}
                              width={40}
                              height={40}
                              className="rounded object-cover"
                            />
                          ) : (
                            <div className="bg-muted flex h-10 w-10 items-center justify-center rounded">
                              <Music className="text-muted-foreground h-4 w-4" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {dl.music?.title ?? "Unknown Track"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {dl.music?.artist?.name ?? "Unknown Artist"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(dl.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRedownload(dl.musicId)}
                          >
                            <Download className="mr-1.5 h-3.5 w-3.5" />
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile List */}
            <div className="sm:hidden">
              {data.downloads.map(
                (dl: {
                  id: string;
                  musicId: string;
                  createdAt: string;
                  music?: { coverImage?: string; title?: string; artist?: { name?: string } };
                }) => (
                  <div
                    key={dl.id}
                    className="border-border/40 flex items-center gap-3 border-b px-4 py-3 last:border-0"
                  >
                    {dl.music?.coverImage ? (
                      <Image
                        src={dl.music.coverImage}
                        alt={dl.music.title ?? "Cover"}
                        width={40}
                        height={40}
                        className="shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded">
                        <Music className="text-muted-foreground h-4 w-4" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {dl.music?.title ?? "Unknown Track"}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {dl.music?.artist?.name ?? "Unknown Artist"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {format(new Date(dl.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRedownload(dl.musicId)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                )
              )}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-muted-foreground text-sm">
            Page {data.page} of {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
