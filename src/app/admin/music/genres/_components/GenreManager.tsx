"use client";

import { useState, useTransition, useMemo } from "react";
import { Pencil, Trash2, GitMerge, Check, X, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { notify } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

interface Genre {
  name: string | null;
  count: number;
}

interface GenreManagerProps {
  initialGenres: Genre[];
}

export function GenreManager({ initialGenres }: GenreManagerProps) {
  const [genres, setGenres] = useState<Genre[]>(initialGenres);
  const [search, setSearch] = useState("");
  const [editingGenre, setEditingGenre] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mergeTarget, setMergeTarget] = useState("");
  const [mergeOpen, setMergeOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (!search.trim()) return genres;
    const q = search.toLowerCase();
    return genres.filter((g) => g.name?.toLowerCase().includes(q));
  }, [genres, search]);

  const nullCount = genres.find((g) => g.name === null)?.count ?? 0;

  async function apiFetch(body: object) {
    const res = await fetch("/api/admin/genres", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Request failed");
    return res.json() as Promise<{ updated: number }>;
  }

  function refreshGenres() {
    fetch("/api/admin/genres")
      .then((r) => r.json())
      .then((d: { genres: Genre[] }) => setGenres(d.genres))
      .catch(() => {});
  }

  function startEdit(name: string) {
    setEditingGenre(name);
    setEditValue(name);
  }

  function cancelEdit() {
    setEditingGenre(null);
    setEditValue("");
  }

  function commitRename(from: string) {
    const to = editValue.trim();
    if (!to || to === from) {
      cancelEdit();
      return;
    }
    startTransition(async () => {
      try {
        const { updated } = await apiFetch({ action: "rename", from, to });
        notify.success(
          `Renamed "${from}" → "${to}" on ${updated} track${updated !== 1 ? "s" : ""}`
        );
        refreshGenres();
        setSelected((prev) => {
          const next = new Set(prev);
          if (next.has(from)) {
            next.delete(from);
            next.add(to);
          }
          return next;
        });
      } catch {
        notify.error("Rename failed");
      } finally {
        cancelEdit();
      }
    });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    startTransition(async () => {
      try {
        const { updated } = await apiFetch({ action: "delete", genre: target });
        notify.success(`Cleared genre on ${updated} track${updated !== 1 ? "s" : ""}`);
        refreshGenres();
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(target);
          return next;
        });
      } catch {
        notify.error("Delete failed");
      }
    });
  }

  function toggleSelect(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  function confirmMerge() {
    const sources = Array.from(selected);
    const target = mergeTarget.trim();
    if (!target) return;
    setMergeOpen(false);
    setSelected(new Set());
    startTransition(async () => {
      try {
        const { updated } = await apiFetch({ action: "merge", sources, target });
        notify.success(
          `Merged ${sources.length} genres → "${target}" on ${updated} track${updated !== 1 ? "s" : ""}`
        );
        refreshGenres();
      } catch {
        notify.error("Merge failed");
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm min-w-0 flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search genres…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-card pl-9"
          />
        </div>
        {selected.size >= 2 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setMergeTarget(Array.from(selected)[0] ?? "");
              setMergeOpen(true);
            }}
            className="gap-1.5"
          >
            <GitMerge className="h-4 w-4" />
            Merge {selected.size} selected
          </Button>
        )}
        {selected.size > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelected(new Set())}
            className="text-muted-foreground"
          >
            Clear selection
          </Button>
        )}
      </div>

      {/* Untagged notice */}
      {nullCount > 0 && (
        <div className="border-border bg-muted/30 rounded-xl border px-4 py-3 text-sm">
          <span className="text-muted-foreground">
            <span className="text-foreground font-semibold">{nullCount}</span> track
            {nullCount !== 1 ? "s" : ""} have no genre set.
          </span>
        </div>
      )}

      {/* Genre rows */}
      <div className="border-border bg-card overflow-hidden rounded-xl border">
        {filtered.filter((g) => g.name !== null).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground text-sm">No genres found</p>
          </div>
        ) : (
          <div className="divide-border divide-y">
            {filtered
              .filter((g) => g.name !== null)
              .map((genre) => {
                const name = genre.name!;
                const isEditing = editingGenre === name;
                const isSelected = selected.has(name);

                return (
                  <div
                    key={name}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 transition-colors",
                      isSelected && "bg-brand/5"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSelect(name)}
                      className={cn(
                        "h-4 w-4 shrink-0 rounded border transition-colors",
                        isSelected
                          ? "bg-brand border-brand"
                          : "border-border hover:border-foreground/40"
                      )}
                      aria-label={isSelected ? "Deselect" : "Select"}
                    >
                      {isSelected && <Check className="m-auto h-3 w-3 text-white" />}
                    </button>

                    {isEditing ? (
                      <div className="flex flex-1 items-center gap-2">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename(name);
                            if (e.key === "Escape") cancelEdit();
                          }}
                          autoFocus
                          className="h-7 max-w-xs text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => commitRename(name)}
                          disabled={isPending}
                          className="text-green-600 hover:text-green-500"
                        >
                          {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="flex-1 text-sm font-medium">{name}</span>
                    )}

                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {genre.count.toLocaleString()} track{genre.count !== 1 ? "s" : ""}
                    </Badge>

                    {!isEditing && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(name)}
                          title="Rename"
                          className="text-muted-foreground hover:text-foreground rounded p-1.5 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(name)}
                          title="Remove genre from tracks"
                          className="text-muted-foreground hover:text-destructive rounded p-1.5 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Merge dialog */}
      <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Merge {selected.size} genres</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="text-muted-foreground text-sm">
              All tracks tagged with the following genres will be re-tagged with the target name:
              <div className="mt-2 flex flex-wrap gap-1.5">
                {Array.from(selected).map((s) => (
                  <Badge key={s} variant="outline">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Merge into</label>
              <Input
                value={mergeTarget}
                onChange={(e) => setMergeTarget(e.target.value)}
                placeholder="Canonical genre name…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmMerge();
                }}
                autoFocus
              />
              <p className="text-muted-foreground text-xs">
                Can be one of the selected genres or a new canonical name.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmMerge}
              disabled={!mergeTarget.trim() || isPending}
              className="bg-brand hover:bg-brand/90 text-brand-foreground"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <GitMerge className="mr-2 h-4 w-4" />
              )}
              Merge genres
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove genre &ldquo;{deleteTarget}&rdquo;?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground py-2 text-sm">
            This will set the genre field to <em>null</em> on all tracks tagged &ldquo;
            {deleteTarget}&rdquo;. The tracks won&apos;t be deleted. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Remove genre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
