"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Pencil, Trash2, Loader2, X, Disc3 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
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
import { AlbumFormDialog } from "./AlbumFormDialog";
import { formatDate } from "@/lib/utils";

const TYPE_COLORS: Record<string, string> = {
  ALBUM: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  EP: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  MIXTAPE: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  COMPILATION: "bg-teal-500/10 text-teal-600 border-teal-500/20",
};

interface Album {
  id: string;
  title: string;
  slug: string;
  coverArt: string | null;
  releaseDate: Date | string | null;
  type: string;
  genre: string | null;
  label: string | null;
  artist: { id: string; name: string; slug: string };
  _count: { tracks: number };
}

interface AlbumsTableProps {
  albums: Album[];
  artists: { id: string; name: string }[];
}

export function AlbumsTable({ albums, artists }: AlbumsTableProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const allSelected = albums.length > 0 && selected.size === albums.length;
  const someSelected = selected.size > 0 && selected.size < albums.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(albums.map((a) => a.id)));
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
    mutationFn: (id: string) => axios.delete(`/api/admin/albums/${id}`),
    onSuccess: () => {
      toast.success("Album deleted");
      setDeleteId(null);
      router.refresh();
    },
    onError: (err) => {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : "Failed to delete album";
      toast.error(msg ?? "Failed to delete album");
    },
  });

  const { mutate: bulkDelete, isPending: isBulkDeleting } = useMutation({
    mutationFn: () =>
      Promise.all(Array.from(selected).map((id) => axios.delete(`/api/admin/albums/${id}`))),
    onSuccess: () => {
      toast.success(`${selected.size} album(s) deleted`);
      setSelected(new Set());
      setBulkDeleteOpen(false);
      router.refresh();
    },
    onError: (err) => {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error
        : "Some albums could not be deleted";
      toast.error(msg ?? "Some albums could not be deleted");
    },
  });

  const deleteTarget = deleteId ? albums.find((a) => a.id === deleteId) : null;

  return (
    <>
      {/* Top actions */}
      <div className="flex items-center justify-between gap-3">
        {selected.size > 0 ? (
          <div className="border-destructive/20 bg-destructive/5 flex flex-1 items-center gap-3 rounded-lg border px-4 py-2.5">
            <span className="text-sm font-medium">
              {selected.size} album{selected.size !== 1 ? "s" : ""} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground h-7 gap-1.5 text-xs"
              onClick={() => setSelected(new Set())}
            >
              <X className="h-3 w-3" /> Clear
            </Button>
            <div className="ml-auto">
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5"
                onClick={() => setBulkDeleteOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete Selected
              </Button>
            </div>
          </div>
        ) : (
          <div className="ml-auto">
            <AlbumFormDialog mode="create" artists={artists} />
          </div>
        )}
      </div>

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
                    aria-label="Select all albums"
                  />
                </TableHead>
                <TableHead className="w-12" />
                <TableHead className="w-[30%]">Title</TableHead>
                <TableHead>Artist</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden md:table-cell">Genre</TableHead>
                <TableHead className="hidden md:table-cell">Released</TableHead>
                <TableHead className="text-right">Tracks</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {albums.map((album) => {
                const isSelected = selected.has(album.id);
                return (
                  <TableRow
                    key={album.id}
                    className={`border-border ${isSelected ? "bg-muted/50" : ""}`}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleOne(album.id)}
                        aria-label={`Select "${album.title}"`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="bg-muted relative h-10 w-10 overflow-hidden rounded-md">
                        {album.coverArt ? (
                          <Image
                            src={album.coverArt}
                            alt={album.title}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Disc3 className="text-muted-foreground/50 h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-foreground line-clamp-1 text-sm font-semibold">
                          {album.title}
                        </p>
                        <p className="text-muted-foreground mt-0.5 text-xs">/{album.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm">{album.artist.name}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] tracking-wide uppercase ${TYPE_COLORS[album.type] ?? ""}`}
                      >
                        {album.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {album.genre ? (
                        <span className="text-muted-foreground text-sm">{album.genre}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-muted-foreground text-sm">
                        {album.releaseDate ? formatDate(album.releaseDate) : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-medium">{album._count.tracks}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <AlbumFormDialog
                          mode="edit"
                          artists={artists}
                          album={album}
                          trigger={
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <Pencil className="h-3.5 w-3.5" />
                              <span className="sr-only">Edit</span>
                            </Button>
                          }
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive h-8 w-8"
                          onClick={() => setDeleteId(album.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Delete</span>
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

      {/* Single delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleteTarget?.title}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Albums with existing tracks cannot be deleted.
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
              Delete {selected.size} album{selected.size !== 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Albums with existing tracks will not be deleted.
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
              Delete {selected.size} Album{selected.size !== 1 ? "s" : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
