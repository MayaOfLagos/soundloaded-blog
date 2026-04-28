"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, Pencil, Trash2, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { DeletePageButton } from "./DeletePageButton";

const STATUS_COLORS: Record<string, string> = {
  PUBLISHED: "bg-green-500/15 text-green-600 border-green-500/20",
  DRAFT: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20",
  SCHEDULED: "bg-blue-500/15 text-blue-600 border-blue-500/20",
  ARCHIVED: "bg-muted text-muted-foreground border-border",
};

const TEMPLATE_COLORS: Record<string, string> = {
  DEFAULT: "bg-brand/10 text-brand border-brand/20",
  LEGAL: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  CONTACT: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  FULL_WIDTH: "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

interface PageRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  template: string;
  publishedAt: Date | string | null;
  updatedAt: Date | string;
  views: number;
  showInHeader: boolean;
  showInFooter: boolean;
  isSystem: boolean;
  author: { name: string | null; email: string } | null;
}

export function PagesTable({ pages }: { pages: PageRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const allSelected = pages.length > 0 && selected.size === pages.length;
  const someSelected = selected.size > 0 && selected.size < pages.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(pages.map((page) => page.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const { mutate: bulkDelete, isPending } = useMutation({
    mutationFn: () => adminApi.post("/api/admin/pages/bulk-delete", { ids: Array.from(selected) }),
    onSuccess: (res) => {
      const { archived = 0, deleted = 0 } = res.data;
      const parts = [];
      if (archived > 0) parts.push(`${archived} archived`);
      if (deleted > 0) parts.push(`${deleted} deleted`);
      toast.success(parts.join(", ") || "Pages processed");
      setSelected(new Set());
      setBulkDeleteOpen(false);
      router.refresh();
    },
    onError: () => toast.error("Failed to process pages"),
  });

  return (
    <>
      {selected.size > 0 && (
        <div className="border-destructive/20 bg-destructive/5 flex items-center justify-between gap-3 rounded-lg border px-4 py-2.5">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              {selected.size} page{selected.size !== 1 ? "s" : ""} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground h-7 gap-1.5 text-xs"
              onClick={() => setSelected(new Set())}
            >
              <X className="h-3 w-3" />
              Clear
            </Button>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5"
            onClick={() => setBulkDeleteOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Selected
          </Button>
        </div>
      )}

      <div className="border-border bg-card overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={toggleAll}
                    aria-label="Select all pages"
                  />
                </TableHead>
                <TableHead className="w-[38%]">Page</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Template</TableHead>
                <TableHead className="hidden md:table-cell">Navigation</TableHead>
                <TableHead className="hidden lg:table-cell">Updated</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Views</TableHead>
                <TableHead className="w-28 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((page) => {
                const isSelected = selected.has(page.id);
                return (
                  <TableRow
                    key={page.id}
                    className={`border-border ${isSelected ? "bg-muted/50" : ""}`}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleOne(page.id)}
                        aria-label={`Select "${page.title}"`}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/pages/${page.id}`}
                            className="text-foreground hover:text-primary line-clamp-1 text-sm font-semibold transition-colors"
                          >
                            {page.title}
                          </Link>
                          {page.isSystem && (
                            <Badge variant="secondary" className="text-[10px] uppercase">
                              System
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          /{page.slug} &middot; by{" "}
                          {page.author?.name ?? page.author?.email ?? "Unknown"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] tracking-wide uppercase ${STATUS_COLORS[page.status] ?? ""}`}
                      >
                        {page.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] tracking-wide uppercase ${TEMPLATE_COLORS[page.template] ?? ""}`}
                      >
                        {page.template.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {page.showInHeader && <Badge variant="secondary">Header</Badge>}
                        {page.showInFooter && <Badge variant="secondary">Footer</Badge>}
                        {!page.showInHeader && !page.showInFooter && (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-muted-foreground text-sm">
                        {formatDate(page.updatedAt)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-right lg:table-cell">
                      <span className="text-sm font-medium">{page.views.toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/pages/${page.id}`}>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="sr-only">Edit</span>
                          </Button>
                        </Link>
                        {page.status === "PUBLISHED" && (
                          <Link href={`/${page.slug}`} target="_blank">
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span className="sr-only">View live</span>
                            </Button>
                          </Link>
                        )}
                        <DeletePageButton
                          pageId={page.id}
                          isArchived={page.status === "ARCHIVED"}
                          isSystem={page.isSystem}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Process {selected.size} page{selected.size !== 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Published or draft pages will be archived. Already archived non-system pages will be
              permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(event) => {
                event.preventDefault();
                bulkDelete();
              }}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Process Pages
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
