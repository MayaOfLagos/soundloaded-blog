"use client";

import React, { useState, useEffect, forwardRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { adminApi, getApiError } from "@/lib/admin-api";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CountryPicker } from "@/components/ui/country-picker";
import { ImageUploadField } from "@/app/admin/settings/_components/ImageUploadField";
import { artistSchema, type ArtistFormValues } from "@/lib/validations/artist";
import { generateSlug } from "@/lib/utils";
import { cn } from "@/lib/utils";

const CDN = process.env.NEXT_PUBLIC_CDN_URL ?? "https://cdn.soundloaded.store";

function toFullUrl(keyOrUrl: string | null): string | null {
  if (!keyOrUrl) return null;
  if (keyOrUrl.startsWith("http")) return keyOrUrl;
  return `${CDN}/${keyOrUrl}`;
}

// ── Floating label input ───────────────────────────────────────────────────
type FloatingInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, error, className, id, ...props }, ref) => (
    <div className="relative">
      <input
        id={id}
        ref={ref}
        placeholder=" "
        className={cn(
          "peer border-input bg-background block w-full rounded-md border",
          "px-3 pt-5 pb-1.5 text-sm transition-colors outline-none",
          "focus:border-ring focus:ring-ring focus:ring-1",
          error && "border-destructive",
          className
        )}
        {...props}
      />
      <label
        htmlFor={id}
        className={cn(
          "text-muted-foreground pointer-events-none absolute top-3.5 left-3 text-sm",
          "transition-all duration-150",
          "peer-focus:text-foreground peer-focus:top-1.5 peer-focus:text-[10px]",
          "peer-not-placeholder-shown:top-1.5 peer-not-placeholder-shown:text-[10px]"
        )}
      >
        {label}
      </label>
      {error && <p className="text-destructive mt-0.5 text-[11px]">{error}</p>}
    </div>
  )
);
FloatingInput.displayName = "FloatingInput";

// ── Floating label textarea ────────────────────────────────────────────────
type FloatingTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
};

const FloatingTextarea = forwardRef<HTMLTextAreaElement, FloatingTextareaProps>(
  ({ label, error, className, id, ...props }, ref) => (
    <div className="relative">
      <textarea
        id={id}
        ref={ref}
        placeholder=" "
        rows={4}
        className={cn(
          "peer border-input bg-background block w-full resize-none rounded-md border",
          "px-3 pt-5 pb-2 text-sm transition-colors outline-none",
          "focus:border-ring focus:ring-ring focus:ring-1",
          error && "border-destructive",
          className
        )}
        {...props}
      />
      <label
        htmlFor={id}
        className={cn(
          "text-muted-foreground pointer-events-none absolute top-3.5 left-3 text-sm",
          "transition-all duration-150",
          "peer-focus:text-foreground peer-focus:top-1.5 peer-focus:text-[10px]",
          "peer-not-placeholder-shown:top-1.5 peer-not-placeholder-shown:text-[10px]"
        )}
      >
        {label}
      </label>
      {error && <p className="text-destructive mt-0.5 text-[11px]">{error}</p>}
    </div>
  )
);
FloatingTextarea.displayName = "FloatingTextarea";

// ── Social platform config ────────────────────────────────────────────────
type SocialKey =
  | "instagram"
  | "twitter"
  | "facebook"
  | "spotify"
  | "appleMusic"
  | "youtube"
  | "tiktok"
  | "soundcloud"
  | "boomplay"
  | "website";

const SOCIAL_PLATFORMS: { key: SocialKey; label: string; placeholder: string }[] = [
  { key: "instagram", label: "Instagram", placeholder: "@handle or profile URL" },
  { key: "twitter", label: "Twitter / X", placeholder: "@handle" },
  { key: "youtube", label: "YouTube", placeholder: "Channel URL" },
  { key: "tiktok", label: "TikTok", placeholder: "@handle or profile URL" },
  { key: "facebook", label: "Facebook", placeholder: "Page URL or handle" },
  { key: "spotify", label: "Spotify", placeholder: "Artist profile URL" },
  { key: "appleMusic", label: "Apple Music", placeholder: "Artist profile URL" },
  { key: "soundcloud", label: "SoundCloud", placeholder: "Profile URL" },
  { key: "boomplay", label: "Boomplay", placeholder: "Artist profile URL" },
  { key: "website", label: "Website", placeholder: "https://..." },
];

// ── Props ──────────────────────────────────────────────────────────────────
interface ArtistData {
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
  youtube?: string | null;
  tiktok?: string | null;
  soundcloud?: string | null;
  boomplay?: string | null;
  website?: string | null;
  verified: boolean;
}

interface ArtistFormDialogProps {
  mode: "create" | "edit";
  artist?: ArtistData;
  trigger?: React.ReactNode;
}

// ── Component ─────────────────────────────────────────────────────────────
export function ArtistFormDialog({ mode, artist, trigger }: ArtistFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  // Track which social fields are expanded
  const [enabledSocials, setEnabledSocials] = useState<Set<SocialKey>>(() => {
    const s = new Set<SocialKey>();
    if (artist) {
      for (const p of SOCIAL_PLATFORMS) {
        if (artist[p.key]) s.add(p.key);
      }
    }
    return s;
  });

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
      youtube: artist?.youtube ?? "",
      tiktok: artist?.tiktok ?? "",
      soundcloud: artist?.soundcloud ?? "",
      boomplay: artist?.boomplay ?? "",
      website: artist?.website ?? "",
      verified: artist?.verified ?? false,
    },
  });

  const name = watch("name");
  const photoValue = watch("photo");
  const coverValue = watch("coverImage");

  useEffect(() => {
    if (!slugTouched && mode === "create" && name) {
      setValue("slug", generateSlug(name));
    }
  }, [name, slugTouched, mode, setValue]);

  // Re-sync enabledSocials when dialog opens for edit mode
  useEffect(() => {
    if (open && artist) {
      const s = new Set<SocialKey>();
      for (const p of SOCIAL_PLATFORMS) {
        if (artist[p.key]) s.add(p.key);
      }
      setEnabledSocials(s);
    }
    if (!open) {
      setSlugTouched(false);
    }
  }, [open, artist]);

  function toggleSocial(key: SocialKey) {
    setEnabledSocials((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        setValue(key, "");
      } else {
        next.add(key);
      }
      return next;
    });
  }

  const { mutate, isPending } = useMutation({
    mutationFn: (data: ArtistFormValues) =>
      mode === "create"
        ? adminApi.post("/api/admin/artists", data)
        : adminApi.put(`/api/admin/artists/${artist!.id}`, data),
    onSuccess: () => {
      toast.success(mode === "create" ? "Artist created" : "Artist updated");
      setOpen(false);
      reset();
      router.refresh();
    },
    onError: (err) => {
      toast.error(getApiError(err, "Something went wrong"));
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

      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Artist" : "Edit Artist"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4 pt-2">
          {/* Name + Slug */}
          <div className="grid gap-3 sm:grid-cols-2">
            <FloatingInput
              id="name"
              label="Name *"
              error={errors.name?.message}
              {...register("name")}
            />
            <FloatingInput
              id="slug"
              label="Slug *"
              error={errors.slug?.message}
              {...register("slug")}
              onChange={(e) => {
                setSlugTouched(true);
                setValue("slug", e.target.value);
              }}
            />
          </div>

          {/* Genre + Country */}
          <div className="grid gap-3 sm:grid-cols-2">
            <FloatingInput id="genre" label="Genre" {...register("genre")} />
            <CountryPicker
              value={watch("country")}
              onChange={(val) => setValue("country", val)}
              error={errors.country?.message}
            />
          </div>

          {/* Profile Photo */}
          <ImageUploadField
            label="Profile Photo"
            value={photoValue ?? null}
            onChange={(key) => setValue("photo", toFullUrl(key) ?? "")}
            type="artist-photo"
            hint="Square image recommended (1:1)"
            imageCropAspectRatio="1:1"
            previewWidth={96}
            previewHeight={96}
            maxFileSize="5MB"
          />

          {/* Cover Image */}
          <ImageUploadField
            label="Cover Image"
            value={coverValue ?? null}
            onChange={(key) => setValue("coverImage", toFullUrl(key) ?? "")}
            type="artist-cover"
            hint="Wide banner image (16:9 recommended)"
            imageCropAspectRatio="16:9"
            previewWidth={320}
            previewHeight={90}
            maxFileSize="5MB"
          />

          {/* Bio */}
          <FloatingTextarea id="bio" label="Bio" error={errors.bio?.message} {...register("bio")} />

          <Separator />

          {/* Social Links */}
          <div className="space-y-3">
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Social Links
            </p>

            {/* Platform toggles */}
            <div className="flex flex-wrap gap-1.5">
              {SOCIAL_PLATFORMS.map((p) => {
                const active = enabledSocials.has(p.key);
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => toggleSocial(p.key)}
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                      active
                        ? "bg-brand border-transparent text-white"
                        : "border-input text-muted-foreground hover:border-brand hover:text-foreground"
                    )}
                  >
                    {active ? "✓ " : ""}
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Expanded inputs */}
            {SOCIAL_PLATFORMS.filter((p) => enabledSocials.has(p.key)).length > 0 && (
              <div className="space-y-3 pt-1">
                {SOCIAL_PLATFORMS.filter((p) => enabledSocials.has(p.key)).map((p) => (
                  <FloatingInput
                    key={p.key}
                    id={p.key}
                    label={p.label}
                    placeholder={p.placeholder}
                    {...register(p.key)}
                  />
                ))}
              </div>
            )}
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
            <label htmlFor="verified" className="cursor-pointer text-sm">
              Verified Artist
            </label>
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
