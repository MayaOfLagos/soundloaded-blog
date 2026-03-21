"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { artistSchema, type ArtistFormValues } from "@/lib/validations/artist";
import { generateSlug } from "@/lib/utils";

interface ArtistFormDialogProps {
  mode: "create" | "edit";
  artist?: {
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
  };
  trigger?: React.ReactNode;
}

export function ArtistFormDialog({ mode, artist, trigger }: ArtistFormDialogProps) {
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
  } = useForm<ArtistFormValues>({
    resolver: zodResolver(artistSchema),
    defaultValues: {
      name: artist?.name ?? "",
      slug: artist?.slug ?? "",
      bio: artist?.bio ?? "",
      photo: artist?.photo ?? "",
      coverImage: artist?.coverImage ?? "",
      country: artist?.country ?? "Nigeria",
      genre: artist?.genre ?? "",
      instagram: artist?.instagram ?? "",
      twitter: artist?.twitter ?? "",
      facebook: artist?.facebook ?? "",
      spotify: artist?.spotify ?? "",
      appleMusic: artist?.appleMusic ?? "",
      verified: artist?.verified ?? false,
    },
  });

  const name = watch("name");

  useEffect(() => {
    if (!slugTouched && mode === "create" && name) {
      setValue("slug", generateSlug(name));
    }
  }, [name, slugTouched, mode, setValue]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: ArtistFormValues) =>
      mode === "create"
        ? axios.post("/api/admin/artists", data)
        : axios.put(`/api/admin/artists/${artist!.id}`, data),
    onSuccess: () => {
      toast.success(mode === "create" ? "Artist created" : "Artist updated");
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
            Add Artist
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Artist" : "Edit Artist"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4 pt-2">
          {/* Name & Slug */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
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

          {/* Genre & Country */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="genre">Genre</Label>
              <Input id="genre" {...register("genre")} placeholder="e.g. Afrobeats" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="country">Country</Label>
              <Input id="country" {...register("country")} />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              {...register("bio")}
              rows={3}
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              placeholder="Short biography..."
            />
          </div>

          {/* Photo & Cover Image */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="photo">Profile Photo URL</Label>
              <Input id="photo" {...register("photo")} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coverImage">Cover Image URL</Label>
              <Input id="coverImage" {...register("coverImage")} placeholder="https://..." />
            </div>
          </div>

          <Separator />

          {/* Social Links */}
          <p className="text-muted-foreground text-sm font-medium">Social Links</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="instagram">Instagram</Label>
              <Input id="instagram" {...register("instagram")} placeholder="@handle" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="twitter">Twitter / X</Label>
              <Input id="twitter" {...register("twitter")} placeholder="@handle" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="facebook">Facebook</Label>
              <Input id="facebook" {...register("facebook")} placeholder="URL or handle" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="spotify">Spotify</Label>
              <Input id="spotify" {...register("spotify")} placeholder="Profile URL" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="appleMusic">Apple Music</Label>
              <Input id="appleMusic" {...register("appleMusic")} placeholder="Profile URL" />
            </div>
          </div>

          <Separator />

          {/* Verified */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="verified"
              {...register("verified")}
              className="text-brand focus:ring-brand h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="verified" className="cursor-pointer text-sm">
              Verified Artist
            </Label>
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
              {mode === "create" ? "Create Artist" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
