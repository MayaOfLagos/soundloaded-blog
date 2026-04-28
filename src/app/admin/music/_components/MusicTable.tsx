"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Trash2,
  Loader2,
  X,
  Music,
  TrendingUp,
  Download,
  Pencil,
  ExternalLink,
  CreditCard,
  Lock,
  Unlock,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatFileSize } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Track {
  id: string;
  title: string;
  slug: string;
  coverArt: string | null;
  genre: string | null;
  format: string;
  fileSize: string;
  downloadCount: number;
  streamCount: number;
  r2Key: string;
  postId: string;
  artist: { id: string; name: string; slug: string };
  album: { id: string; title: string; slug: string } | null;
}

interface MusicTableProps {
  tracks: Track[];
}

export function MusicTable({ tracks }: MusicTableProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const [monetizationTrack, setMonetizationTrack] = useState<Track | null>(null);
  const [accessModel, setAccessModel] = useState("free");
  const [streamAccess, setStreamAccess] = useState("free");
  const [creatorPrice, setCreatorPrice] = useState("");

  function openMonetization(track: Track) {
    setMonetizationTrack(track);
    const t = track as unknown as Record<string, unknown>;
    setAccessModel((t.accessModel as string) ?? "free");
    setStreamAccess((t.streamAccess as string) ?? "free");
    setCreatorPrice("");
  }

  const { mutate: saveMonetization, isPending: isSavingMon } = useMutation({
    mutationFn: (id: string) =>
      adminApi.patch(`/api/admin/music/${id}/monetization`, {
        accessModel,
        streamAccess,
        creatorPrice: creatorPrice ? Math.round(parseFloat(creatorPrice) * 100) : null,
      }),
    onSuccess: () => {
      toast.success("Monetization settings saved");
      setMonetizationTrack(null);
      router.refresh();
    },
    onError: () => toast.error("Failed to save monetization settings"),
  });

  const allSelected = tracks.length > 0 && selected.size === tracks.length;
  const someSelected = selected.size > 0 && selected.size < tracks.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(tracks.map((t) => t.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const { mutate: deleteOne, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => adminApi.delete(`/api/admin/music/${id}`),
    onSuccess: () => {
      toast.success("Track deleted");
      setDeleteId(null);
      router.refresh();
    },
    onError: () => toast.error("Failed to delete track"),
  });

  const { mutate: bulkDelete, isPending: isBulkDeleting } = useMutation({
    mutationFn: () => adminApi.post("/api/admin/music/bulk-delete", { ids: Array.from(selected) }),
    onSuccess: (res) => {
      const count = res.data.deleted ?? selected.size;
      toast.success(`${count} track${count !== 1 ? "s" : ""} deleted`);
      setSelected(new Set());
      setBulkDeleteOpen(false);
      router.refresh();
    },
    onError: () => toast.error("Failed to delete tracks"),
  });

  const deleteTarget = deleteId ? tracks.find((t) => t.id === deleteId) : null;

  return (
    <>
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="border-destructive/20 bg-destructive/5 flex items-center justify-between gap-3 rounded-lg border px-4 py-2.5">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              {selected.size} track{selected.size !== 1 ? "s" : ""} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground h-7 gap-1.5 text-xs"
              onClick={() => setSelected(new Set())}
            >
              <X className="h-3 w-3" /> Clear
            </Button>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5"
            onClick={() => setBulkDeleteOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete Selected
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border-border bg-card overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={toggleAll}
                    aria-label="Select all tracks"
                  />
                </TableHead>
                <TableHead className="w-12" />
                <TableHead className="w-[30%]">Title</TableHead>
                <TableHead>Artist</TableHead>
                <TableHead className="hidden md:table-cell">Genre</TableHead>
                <TableHead className="hidden md:table-cell">Format</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Size</TableHead>
                <TableHead className="text-right">Stats</TableHead>
                <TableHead className="w-28 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tracks.map((track) => {
                const isSelected = selected.has(track.id);
                return (
                  <TableRow
                    key={track.id}
                    className={`border-border ${isSelected ? "bg-muted/50" : ""}`}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleOne(track.id)}
                        aria-label={`Select "${track.title}"`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="bg-muted relative h-10 w-10 overflow-hidden rounded-md">
                        {track.coverArt ? (
                          <Image
                            src={track.coverArt}
                            alt={track.title}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Music className="text-muted-foreground/50 h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-foreground line-clamp-1 text-sm font-semibold">
                          {track.title}
                        </p>
                        {track.album && (
                          <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                            {track.album.title}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm">{track.artist.name}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {track.genre ? (
                        <Badge variant="outline" className="text-[10px] tracking-wide uppercase">
                          {track.genre}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="secondary" className="text-[10px] tracking-wide uppercase">
                        {track.format}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-right lg:table-cell">
                      <span className="text-muted-foreground text-sm">
                        {formatFileSize(Number(track.fileSize))}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="space-y-0.5 text-xs">
                        <div className="flex items-center justify-end gap-1">
                          <Download className="h-3 w-3 text-green-500" />
                          <span className="font-medium">
                            {track.downloadCount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-end gap-1">
                          <TrendingUp className="h-3 w-3 text-blue-500" />
                          <span className="text-muted-foreground">
                            {track.streamCount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {!track.r2Key && (
                        <Badge
                          variant="outline"
                          className="mt-1 border-amber-500/30 text-[9px] text-amber-500"
                        >
                          No Audio
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          title="Monetization settings"
                          onClick={() => openMonetization(track)}
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                        </Button>
                        <Link href={`/admin/posts/${track.postId}`}>
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Edit post">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Link href={`/music/${track.slug}`} target="_blank">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            title="Open track page"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive h-8 w-8"
                          onClick={() => setDeleteId(track.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Monetization dialog */}
      <Dialog open={!!monetizationTrack} onOpenChange={(o) => !o && setMonetizationTrack(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Monetization
            </DialogTitle>
            <DialogDescription>
              Set access model for &ldquo;{monetizationTrack?.title}&rdquo;
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Download Access</Label>
              <Select value={accessModel} onValueChange={setAccessModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">
                    <span className="flex items-center gap-2">
                      <Unlock className="h-3.5 w-3.5 text-green-500" /> Free for all
                    </span>
                  </SelectItem>
                  <SelectItem value="subscription">
                    <span className="flex items-center gap-2">
                      <Lock className="text-brand h-3.5 w-3.5" /> Subscribers only
                    </span>
                  </SelectItem>
                  <SelectItem value="purchase">
                    <span className="flex items-center gap-2">
                      <CreditCard className="h-3.5 w-3.5 text-amber-500" /> Purchase required
                    </span>
                  </SelectItem>
                  <SelectItem value="both">
                    <span className="flex items-center gap-2">
                      <Lock className="h-3.5 w-3.5 text-purple-500" /> Subscription or purchase
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Stream Access</Label>
              <Select value={streamAccess} onValueChange={setStreamAccess}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free to stream</SelectItem>
                  <SelectItem value="subscription">Subscribers only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(accessModel === "purchase" || accessModel === "both") && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Creator Price (₦)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 100"
                  value={creatorPrice}
                  onChange={(e) => setCreatorPrice(e.target.value)}
                />
                <p className="text-muted-foreground text-xs">Leave blank to use platform default</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMonetizationTrack(null)}>
              Cancel
            </Button>
            <Button
              disabled={isSavingMon}
              onClick={() => monetizationTrack && saveMonetization(monetizationTrack.id)}
            >
              {isSavingMon && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleteTarget?.title}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This track will be permanently deleted and its companion post will be archived. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                if (deleteId) deleteOne(deleteId);
              }}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete dialog */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selected.size} track{selected.size !== 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              These tracks will be permanently deleted and their companion posts will be archived.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isBulkDeleting}
              onClick={(e) => {
                e.preventDefault();
                bulkDelete();
              }}
            >
              {isBulkDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete {selected.size} Track{selected.size !== 1 ? "s" : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
