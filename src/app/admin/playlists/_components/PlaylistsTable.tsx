"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2, Loader2, X, ExternalLink } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { notify } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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

interface PlaylistRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  isPublic: boolean;
  trackCount: number;
  ownerName: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PlaylistsTableProps {
  playlists: PlaylistRow[];
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PlaylistsTable({ playlists }: PlaylistsTableProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const allSelected = playlists.length > 0 && selected.size === playlists.length;
  const someSelected = selected.size > 0 && selected.size < playlists.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(playlists.map((p) => p.id)));
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
    mutationFn: (id: string) => axios.delete(`/api/admin/playlists/${id}`),
    onSuccess: () => {
      notify.success("Playlist deleted");
      setDeleteId(null);
      router.refresh();
    },
    onError: () => notify.error("Failed to delete playlist"),
  });

  const { mutate: bulkDelete, isPending: isBulkDeleting } = useMutation({
    mutationFn: () =>
      Promise.all(Array.from(selected).map((id) => axios.delete(`/api/admin/playlists/${id}`))),
    onSuccess: () => {
      notify.success(`${selected.size} playlist(s) deleted`);
      setSelected(new Set());
      setBulkDeleteOpen(false);
      router.refresh();
    },
    onError: () => notify.error("Some playlists could not be deleted"),
  });

  const { mutate: togglePublic } = useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      axios.patch(`/api/admin/playlists/${id}`, { isPublic }),
    onSuccess: () => {
      notify.success("Visibility updated");
      router.refresh();
    },
    onError: () => notify.error("Failed to update visibility"),
  });

  const deleteTarget = deleteId ? playlists.find((p) => p.id === deleteId) : null;

  return (
    <>
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="border-destructive/20 bg-destructive/5 flex items-center justify-between gap-3 rounded-lg border px-4 py-2.5">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{selected.size} selected</span>
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
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="w-[35%]">Title</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="text-center">Tracks</TableHead>
                <TableHead className="text-center">Public</TableHead>
                <TableHead className="hidden md:table-cell">Updated</TableHead>
                <TableHead className="w-28 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playlists.map((p) => (
                <TableRow
                  key={p.id}
                  className={`border-border ${selected.has(p.id) ? "bg-muted/50" : ""}`}
                >
                  <TableCell>
                    <Checkbox
                      checked={selected.has(p.id)}
                      onCheckedChange={() => toggleOne(p.id)}
                      aria-label={`Select "${p.title}"`}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-foreground line-clamp-1 text-sm font-semibold">
                        {p.title}
                      </p>
                      {p.description && (
                        <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                          {p.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">{p.ownerName}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{p.trackCount}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={p.isPublic}
                      onCheckedChange={(checked) => togglePublic({ id: p.id, isPublic: checked })}
                      aria-label={p.isPublic ? "Make private" : "Make public"}
                    />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-muted-foreground text-sm">{formatDate(p.updatedAt)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/playlists/${p.id}`} target="_blank">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          title="View public page"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive h-8 w-8"
                        onClick={() => setDeleteId(p.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Single delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleteTarget?.title}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This playlist and all its track associations will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 text-white hover:bg-red-600"
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                if (deleteId) deleteOne(deleteId);
              }}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete dialog */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selected.size} playlist{selected.size !== 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 text-white hover:bg-red-600"
              disabled={isBulkDeleting}
              onClick={(e) => {
                e.preventDefault();
                bulkDelete();
              }}
            >
              {isBulkDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete{" "}
              {selected.size}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
