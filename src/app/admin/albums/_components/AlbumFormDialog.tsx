"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { albumSchema, type AlbumFormValues } from "@/lib/validations/album";
import { generateSlug } from "@/lib/utils";

const TYPE_OPTIONS = ["ALBUM", "EP", "MIXTAPE", "COMPILATION"] as const;

interface AlbumFormDialogProps {
  mode: "create" | "edit";
  artists: { id: string; name: string }[];
  album?: {
    id: string;
    title: string;
    slug: string;
    coverArt: string | null;
    releaseDate: Date | string | null;
    type: string;
    genre: string | null;
    label: string | null;
    artist: { id: string; name: string };
  };
  trigger?: React.ReactNode;
}

export function AlbumFormDialog({ mode, artists, album, trigger }: AlbumFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AlbumFormValues>({
    resolver: zodResolver(albumSchema) as Resolver<AlbumFormValues>,
    defaultValues: {
      title: album?.title ?? "",
      slug: album?.slug ?? "",
      artistId: album?.artist?.id ?? "",
      coverArt: album?.coverArt ?? "",
      releaseDate: album?.releaseDate
        ? new Date(album.releaseDate).toISOString().split("T")[0]
        : "",
      type: (album?.type as AlbumFormValues["type"]) ?? "ALBUM",
      genre: album?.genre ?? "",
      label: album?.label ?? "",
    },
  });

  const title = watch("title");

  useEffect(() => {
    if (!slugTouched && mode === "create" && title) {
      setValue("slug", generateSlug(title));
    }
  }, [title, slugTouched, mode, setValue]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: AlbumFormValues) =>
      mode === "create"
        ? axios.post("/api/admin/albums", data)
        : axios.put(`/api/admin/albums/${album!.id}`, data),
    onSuccess: () => {
      toast.success(mode === "create" ? "Album created" : "Album updated");
      setOpen(false);
      reset();
      setSlugTouched(false);
      router.refresh();
    },
    onError: (err) => {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? "Something went wrong")
        : "Something went wrong";
      toast.error(typeof msg === "string" ? msg : "Validation error");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="bg-brand hover:bg-brand/90 text-brand-foreground gap-1.5">
            <Plus className="h-4 w-4" />
            Add Album
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Album" : "Edit Album"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4 pt-2">
          {/* Title & Slug */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" {...register("title")} />
              {errors.title && <p className="text-destructive text-xs">{errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                {...register("slug")}
                onChange={(e) => {
                  setSlugTouched(true);
                  setValue("slug", e.target.value);
                }}
              />
              {errors.slug && <p className="text-destructive text-xs">{errors.slug.message}</p>}
            </div>
          </div>

          {/* Artist & Type */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Artist *</Label>
              <Select
                defaultValue={album?.artist?.id ?? ""}
                onValueChange={(v) => setValue("artistId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select artist" />
                </SelectTrigger>
                <SelectContent>
                  {artists.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.artistId && (
                <p className="text-destructive text-xs">{errors.artistId.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                defaultValue={album?.type ?? "ALBUM"}
                onValueChange={(v) => setValue("type", v as AlbumFormValues["type"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Genre & Label */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="genre">Genre</Label>
              <Input id="genre" {...register("genre")} placeholder="e.g. Afrobeats" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="label">Label</Label>
              <Input id="label" {...register("label")} placeholder="Record label" />
            </div>
          </div>

          {/* Release Date & Cover Art */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="releaseDate">Release Date</Label>
              <Input id="releaseDate" type="date" {...register("releaseDate")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coverArt">Cover Art URL</Label>
              <Input id="coverArt" {...register("coverArt")} placeholder="https://..." />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-brand hover:bg-brand/90 text-brand-foreground"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Create Album" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
