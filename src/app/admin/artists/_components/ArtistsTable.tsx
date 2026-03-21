"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Pencil, Trash2, Loader2, X, Mic2, BadgeCheck } from "lucide-react";
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
import { ArtistFormDialog } from "./ArtistFormDialog";

interface Artist {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  photo: string | null;
  coverImage: string | null;
  country: string | null;
  genre: string | null;
  instagram: string | null;
  twitter: string | null;
  facebook: string | null;
  spotify: string | null;
  appleMusic: string | null;
  verified: boolean;
  _count: { music: number; albums: number };
}

interface ArtistsTableProps {
  artists: Artist[];
}

export function ArtistsTable({ artists }: ArtistsTableProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const allSelected = artists.length > 0 && selected.size === artists.length;
  const someSelected = selected.size > 0 && selected.size < artists.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(artists.map((a) => a.id)));
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
    mutationFn: (id: string) => axios.delete(`/api/admin/artists/${id}`),
    onSuccess: () => {
      toast.success("Artist deleted");
      setDeleteId(null);
      router.refresh();
    },
    onError: (err) => {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : "Failed to delete artist";
      toast.error(msg ?? "Failed to delete artist");
    },
  });

  const { mutate: bulkDelete, isPending: isBulkDeleting } = useMutation({
    mutationFn: () =>
      Promise.all(Array.from(selected).map((id) => axios.delete(`/api/admin/artists/${id}`))),
    onSuccess: () => {
      toast.success(`${selected.size} artist(s) deleted`);
      setSelected(new Set());
      setBulkDeleteOpen(false);
      router.refresh();
    },
    onError: (err) => {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error
        : "Some artists could not be deleted";
      toast.error(msg ?? "Some artists could not be deleted");
    },
  });

  const deleteTarget = deleteId ? artists.find((a) => a.id === deleteId) : null;

  return (
    <>
      {/* Top actions */}
      <div className="flex items-center justify-between gap-3">
        {selected.size > 0 ? (
          <div className="border-destructive/20 bg-destructive/5 flex flex-1 items-center gap-3 rounded-lg border px-4 py-2.5">
            <span className="text-sm font-medium">
              {selected.size} artist{selected.size !== 1 ? "s" : ""} selected
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
            <ArtistFormDialog mode="create" />
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
                    aria-label="Select all artists"
                  />
                </TableHead>
                <TableHead className="w-12" />
                <TableHead className="w-[30%]">Name</TableHead>
                <TableHead>Genre</TableHead>
                <TableHead className="hidden md:table-cell">Country</TableHead>
                <TableHead className="text-right">Songs</TableHead>
                <TableHead className="hidden text-right md:table-cell">Albums</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {artists.map((artist) => {
                const isSelected = selected.has(artist.id);
                return (
                  <TableRow
                    key={artist.id}
                    className={`border-border ${isSelected ? "bg-muted/50" : ""}`}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleOne(artist.id)}
                        aria-label={`Select "${artist.name}"`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="bg-muted relative h-10 w-10 overflow-hidden rounded-full">
                        {artist.photo ? (
                          <Image
                            src={artist.photo}
                            alt={artist.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Mic2 className="text-muted-foreground/50 h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-foreground flex items-center gap-1 text-sm font-semibold">
                          <span className="line-clamp-1">{artist.name}</span>
                          {artist.verified && (
                            <BadgeCheck className="h-4 w-4 flex-shrink-0 fill-blue-500 text-white" />
                          )}
                        </p>
                        <p className="text-muted-foreground mt-0.5 text-xs">/{artist.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {artist.genre ? (
                        <Badge variant="outline" className="text-[10px] tracking-wide uppercase">
                          {artist.genre}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-muted-foreground text-sm">{artist.country ?? "—"}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-medium">{artist._count.music}</span>
                    </TableCell>
                    <TableCell className="hidden text-right md:table-cell">
                      <span className="text-sm font-medium">{artist._count.albums}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <ArtistFormDialog
                          mode="edit"
                          artist={artist}
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
                          onClick={() => setDeleteId(artist.id)}
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
            <AlertDialogTitle>Delete &ldquo;{deleteTarget?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Artists with existing tracks or albums cannot be
              deleted.
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
              Delete {selected.size} artist{selected.size !== 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Artists with existing tracks or albums will not be deleted.
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
              Delete {selected.size} Artist{selected.size !== 1 ? "s" : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
