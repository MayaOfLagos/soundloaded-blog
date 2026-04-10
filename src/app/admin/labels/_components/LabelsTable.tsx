"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Pencil, Trash2, Loader2, X, Building2, BadgeCheck } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { adminApi, getApiError } from "@/lib/admin-api";
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
import { LabelFormDialog } from "./LabelFormDialog";

interface Label {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  logo: string | null;
  coverImage: string | null;
  country: string | null;
  website: string | null;
  instagram: string | null;
  twitter: string | null;
  facebook: string | null;
  spotify: string | null;
  appleMusic: string | null;
  verified: boolean;
  owner: { id: string; name: string | null; email: string } | null;
  _count: { artists: number };
}

interface LabelsTableProps {
  labels: Label[];
}

export function LabelsTable({ labels }: LabelsTableProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const allSelected = labels.length > 0 && selected.size === labels.length;
  const someSelected = selected.size > 0 && selected.size < labels.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(labels.map((l) => l.id)));
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
    mutationFn: (id: string) => adminApi.delete(`/api/admin/labels/${id}`),
    onSuccess: () => {
      toast.success("Label deleted");
      setDeleteId(null);
      router.refresh();
    },
    onError: (err) => {
      toast.error(getApiError(err, "Failed to delete label"));
    },
  });

  const { mutate: bulkDelete, isPending: isBulkDeleting } = useMutation({
    mutationFn: () => adminApi.post("/api/admin/labels/bulk-delete", { ids: Array.from(selected) }),
    onSuccess: (res) => {
      const { deleted, skipped } = res.data as { deleted: number; skipped: number };
      if (skipped > 0) {
        toast.success(`${deleted} label(s) deleted, ${skipped} skipped (have artists)`);
      } else {
        toast.success(`${deleted} label(s) deleted`);
      }
      setSelected(new Set());
      setBulkDeleteOpen(false);
      router.refresh();
    },
    onError: (err) => {
      toast.error(getApiError(err, "Some labels could not be deleted"));
    },
  });

  const deleteTarget = deleteId ? labels.find((l) => l.id === deleteId) : null;

  return (
    <>
      {/* Top actions */}
      <div className="flex items-center justify-between gap-3">
        {selected.size > 0 ? (
          <div className="border-destructive/20 bg-destructive/5 flex flex-1 items-center gap-3 rounded-lg border px-4 py-2.5">
            <span className="text-sm font-medium">
              {selected.size} label{selected.size !== 1 ? "s" : ""} selected
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
            <LabelFormDialog mode="create" />
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
                    aria-label="Select all labels"
                  />
                </TableHead>
                <TableHead className="w-12" />
                <TableHead className="w-[25%]">Name</TableHead>
                <TableHead className="hidden md:table-cell">Country</TableHead>
                <TableHead className="text-right">Artists</TableHead>
                <TableHead className="hidden md:table-cell">Owner</TableHead>
                <TableHead className="hidden sm:table-cell">Verified</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {labels.map((label) => {
                const isSelected = selected.has(label.id);
                return (
                  <TableRow
                    key={label.id}
                    className={`border-border ${isSelected ? "bg-muted/50" : ""}`}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleOne(label.id)}
                        aria-label={`Select "${label.name}"`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="bg-muted relative h-10 w-10 overflow-hidden rounded-lg">
                        {label.logo ? (
                          <Image
                            src={label.logo}
                            alt={label.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Building2 className="text-muted-foreground/50 h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-foreground flex items-center gap-1 text-sm font-semibold">
                          <span className="line-clamp-1">{label.name}</span>
                          {label.verified && (
                            <BadgeCheck className="h-4 w-4 flex-shrink-0 fill-blue-500 text-white" />
                          )}
                        </p>
                        <p className="text-muted-foreground mt-0.5 text-xs">/{label.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-muted-foreground text-sm">{label.country ?? "—"}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-medium">{label._count.artists}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {label.owner ? (
                        <div>
                          <p className="text-sm">{label.owner.name ?? "—"}</p>
                          <p className="text-muted-foreground text-xs">{label.owner.email}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {label.verified ? (
                        <Badge
                          variant="outline"
                          className="border-blue-500/30 bg-blue-500/10 text-[10px] text-blue-600"
                        >
                          Verified
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <LabelFormDialog
                          mode="edit"
                          label={label}
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
                          onClick={() => setDeleteId(label.id)}
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
              This action cannot be undone. Labels with associated artists cannot be deleted.
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
              Delete {selected.size} label{selected.size !== 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Labels with associated artists will not be deleted.
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
              Delete {selected.size} Label{selected.size !== 1 ? "s" : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
