"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import type { JSONContent } from "@tiptap/react";
import {
  ArrowLeft,
  Loader2,
  Upload,
  ImageIcon,
  X,
  FileAudio,
  Clock,
  HardDrive,
  Disc3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { generateSlug, formatFileSize } from "@/lib/utils";
import {
  AudioUploadZone,
  type AudioUploadResult,
  type AudioMetadataResult,
} from "@/components/admin/AudioUploadZone";
import { MediaPickerModal } from "@/components/admin/MediaPickerModal";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import type { MediaItem } from "@/components/admin/MediaGrid";

const musicSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
  artistId: z.string().min(1, "Artist is required"),
  albumId: z.string().optional(),
  genre: z.string().optional(),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  format: z.enum(["MP3", "FLAC", "WAV", "AAC", "OGG"]),
  r2Key: z.string().min(1, "Upload an audio file first"),
  filename: z.string().min(1),
  fileSize: z.coerce.number().int().positive(),
  duration: z.coerce.number().int().positive().optional(),
  bitrate: z.coerce.number().int().positive().optional(),
  trackNumber: z.coerce.number().int().positive().optional(),
  coverArt: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  label: z.string().optional(),
  isExclusive: z.boolean(),
  price: z.coerce.number().int().min(0).optional(),
  enableDownload: z.boolean(),
});

type MusicFormValues = z.infer<typeof musicSchema>;

interface Artist {
  id: string;
  name: string;
}

interface Album {
  id: string;
  title: string;
  artistId: string;
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MusicUploadPage() {
  const router = useRouter();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [filteredAlbums, setFilteredAlbums] = useState<Album[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  // Upload state
  const [uploadResult, setUploadResult] = useState<AudioUploadResult | null>(null);
  const [autoFilled, setAutoFilled] = useState<Set<string>>(new Set());

  // Cover art state
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [coverArtUrl, setCoverArtUrl] = useState<string | null>(null);

  // Description state (TipTap JSON)
  const [description, setDescription] = useState<JSONContent | null>(null);

  const form = useForm<MusicFormValues>({
    resolver: zodResolver(musicSchema) as Resolver<MusicFormValues>,
    defaultValues: {
      title: "",
      slug: "",
      artistId: "",
      albumId: "",
      genre: "",
      year: new Date().getFullYear(),
      format: "MP3",
      r2Key: "",
      filename: "",
      fileSize: 0,
      duration: undefined,
      bitrate: undefined,
      trackNumber: undefined,
      coverArt: "",
      label: "",
      isExclusive: false,
      price: undefined,
      enableDownload: true,
    },
  });

  const titleValue = form.watch("title");
  const artistIdValue = form.watch("artistId");

  useEffect(() => {
    if (!slugTouched && titleValue) {
      form.setValue("slug", generateSlug(titleValue), { shouldValidate: true });
    }
  }, [titleValue, slugTouched, form]);

  useEffect(() => {
    if (artistIdValue) {
      setFilteredAlbums(albums.filter((a) => a.artistId === artistIdValue));
    } else {
      setFilteredAlbums(albums);
    }
    form.setValue("albumId", "");
  }, [artistIdValue, albums, form]);

  useEffect(() => {
    async function loadData() {
      try {
        const [artistRes, albumRes] = await Promise.all([
          axios.get<{ artists: Artist[] }>("/api/admin/artists?limit=500"),
          axios.get<{ albums: Album[] }>("/api/admin/albums"),
        ]);
        setArtists(artistRes.data.artists ?? []);
        setAlbums(albumRes.data.albums ?? []);
        setFilteredAlbums(albumRes.data.albums ?? []);
      } catch {
        // non-blocking
      }
    }
    loadData();
  }, []);

  // Auto-fill from ID3 metadata
  const handleMetadataExtracted = useCallback(
    (meta: AudioMetadataResult) => {
      const filled = new Set<string>();

      if (meta.title && !form.getValues("title")) {
        form.setValue("title", meta.title, { shouldValidate: true });
        filled.add("title");
      }

      if (meta.genre && !form.getValues("genre")) {
        form.setValue("genre", meta.genre);
        filled.add("genre");
      }

      if (meta.year) {
        form.setValue("year", meta.year);
        filled.add("year");
      }

      if (meta.trackNumber) {
        form.setValue("trackNumber", meta.trackNumber);
        filled.add("trackNumber");
      }

      if (meta.label && !form.getValues("label")) {
        form.setValue("label", meta.label);
        filled.add("label");
      }

      if (meta.duration) {
        form.setValue("duration", meta.duration);
        filled.add("duration");
      }

      if (meta.bitrate) {
        form.setValue("bitrate", meta.bitrate);
        filled.add("bitrate");
      }

      if (meta.format) {
        form.setValue("format", meta.format as MusicFormValues["format"]);
        filled.add("format");
      }

      // Try to match artist name
      if (meta.artist) {
        const match = artists.find((a) => a.name.toLowerCase() === meta.artist!.toLowerCase());
        if (match) {
          form.setValue("artistId", match.id);
          filled.add("artistId");

          // Try to match album
          if (meta.album) {
            const albumsForArtist = albums.filter((a) => a.artistId === match.id);
            const albumMatch = albumsForArtist.find(
              (a) => a.title.toLowerCase() === meta.album!.toLowerCase()
            );
            if (albumMatch) {
              form.setValue("albumId", albumMatch.id);
              filled.add("albumId");
            }
          }
        }
      }

      setAutoFilled(filled);
    },
    [artists, albums, form]
  );

  // Auto-fill from upload result
  const handleUploadComplete = useCallback(
    (result: AudioUploadResult) => {
      setUploadResult(result);
      form.setValue("r2Key", result.r2Key);
      form.setValue("filename", result.filename);
      form.setValue("fileSize", result.fileSize);
    },
    [form]
  );

  // Auto-fill cover art from ID3 extraction
  const handleCoverArtUploaded = useCallback(
    (url: string) => {
      setCoverArtUrl(url);
      form.setValue("coverArt", url);
      setAutoFilled((prev) => new Set(prev).add("coverArt"));
    },
    [form]
  );

  // Cover art picker
  const handleCoverArtSelect = useCallback(
    (media: MediaItem | MediaItem[]) => {
      const item = Array.isArray(media) ? media[0] : media;
      if (item) {
        setCoverArtUrl(item.url);
        form.setValue("coverArt", item.url);
      }
      setShowCoverPicker(false);
    },
    [form]
  );

  const onSubmit = async (values: MusicFormValues) => {
    if (!uploadResult) {
      toast.error("Please upload an audio file first");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        albumId: values.albumId || null,
        genre: values.genre || null,
        coverArt: values.coverArt || null,
        label: values.label || null,
        fileSize: BigInt(values.fileSize).toString(),
        price: values.isExclusive && values.price ? values.price * 100 : null,
        enableDownload: values.enableDownload,
        body: description,
      };
      await axios.post("/api/admin/music", payload);
      toast.success("Music track saved successfully!");
      router.push("/admin/music");
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? "Failed to save music track")
        : "Failed to save music track";
      toast.error(typeof msg === "string" ? msg : "Validation error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const autoLabel = (field: string) =>
    autoFilled.has(field) ? (
      <span className="ml-1.5 text-xs font-normal text-emerald-600 dark:text-emerald-400">
        (auto-filled)
      </span>
    ) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/music">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to music</span>
          </Button>
        </Link>
        <div>
          <h1 className="text-foreground text-2xl font-black">Upload Music</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Upload audio file — metadata is extracted automatically
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr,320px]">
            {/* ── LEFT COLUMN (main) ── */}
            <div className="space-y-6">
              {/* Audio Upload Zone */}
              <AudioUploadZone
                onUploadComplete={handleUploadComplete}
                onMetadataExtracted={handleMetadataExtracted}
                onCoverArtUploaded={handleCoverArtUploaded}
                onFileSelected={() => {
                  setUploadResult(null);
                  setAutoFilled(new Set());
                  setCoverArtUrl(null);
                  form.setValue("coverArt", "");
                }}
                disabled={isSubmitting}
              />

              {/* Track Metadata */}
              <div className="border-border bg-card space-y-5 rounded-xl border p-5">
                <p className="text-foreground text-sm font-semibold">Track Details</p>

                {/* Title + Slug */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title * {autoLabel("title")}</FormLabel>
                        <FormControl>
                          <Input placeholder="Track title..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="track-slug"
                            {...field}
                            onChange={(e) => {
                              setSlugTouched(true);
                              field.onChange(e);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Artist + Album */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="artistId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Artist * {autoLabel("artistId")}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select artist" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {artists.map((a) => (
                              <SelectItem key={a.id} value={a.id}>
                                {a.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="albumId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Album {autoLabel("albumId")}</FormLabel>
                        <Select
                          onValueChange={(val) => field.onChange(val === "__none__" ? "" : val)}
                          value={field.value || "__none__"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="No album" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__none__">No album (single)</SelectItem>
                            {filteredAlbums.map((a) => (
                              <SelectItem key={a.id} value={a.id}>
                                {a.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Genre + Year + Track # */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="genre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Genre {autoLabel("genre")}</FormLabel>
                        <FormControl>
                          <Input placeholder="Afrobeats..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year {autoLabel("year")}</FormLabel>
                        <FormControl>
                          <Input type="number" min={1900} max={2100} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="trackNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Track # {autoLabel("trackNumber")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            placeholder="1"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Label */}
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label {autoLabel("label")}</FormLabel>
                      <FormControl>
                        <Input placeholder="Record label..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Duration + Bitrate */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (secs) {autoLabel("duration")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            placeholder="210"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bitrate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bitrate (kbps) {autoLabel("bitrate")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            placeholder="320"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Description (TipTap) */}
              <div className="border-border bg-card space-y-3 rounded-xl border p-5">
                <p className="text-foreground text-sm font-semibold">Description</p>
                <p className="text-muted-foreground text-xs">
                  Write about this track — displayed on the music detail page
                </p>
                <RichTextEditor
                  content={description}
                  onChange={setDescription}
                  placeholder="Write about this track..."
                  className="[&_.ProseMirror]:min-h-[200px]"
                />
              </div>
            </div>

            {/* ── RIGHT COLUMN (sidebar) ── */}
            <div className="space-y-5">
              {/* Cover Art */}
              <div className="border-border bg-card space-y-3 rounded-xl border p-5">
                <div className="flex items-center justify-between">
                  <p className="text-foreground text-sm font-semibold">
                    Cover Art {autoLabel("coverArt")}
                  </p>
                </div>

                {coverArtUrl ? (
                  <div
                    className="border-border group relative aspect-square w-full cursor-pointer overflow-hidden rounded-xl border"
                    onClick={() => setShowCoverPicker(true)}
                  >
                    <Image
                      src={coverArtUrl}
                      alt="Cover art"
                      fill
                      className="object-cover transition-opacity group-hover:opacity-80"
                      sizes="320px"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="text-sm font-medium text-white">Change</span>
                    </div>
                  </div>
                ) : (
                  <div
                    className="border-border bg-muted/30 hover:border-foreground/20 flex aspect-square w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors"
                    onClick={() => setShowCoverPicker(true)}
                  >
                    <ImageIcon className="text-muted-foreground/40 mb-2 h-10 w-10" />
                    <span className="text-muted-foreground text-sm">Click to set cover art</span>
                    <span className="text-muted-foreground/60 mt-1 text-xs">
                      or pick from library
                    </span>
                  </div>
                )}

                {coverArtUrl && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5"
                      onClick={() => setShowCoverPicker(true)}
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      Change
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        setCoverArtUrl(null);
                        form.setValue("coverArt", "");
                        setAutoFilled((prev) => {
                          const next = new Set(prev);
                          next.delete("coverArt");
                          return next;
                        });
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                      Remove
                    </Button>
                  </div>
                )}
              </div>

              {/* File Details Card (shown after upload) */}
              {uploadResult && (
                <div className="border-border bg-card space-y-3 rounded-xl border p-5">
                  <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    File Details
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileAudio className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                      <span className="text-muted-foreground truncate text-sm">
                        {uploadResult.filename}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HardDrive className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                      <span className="text-muted-foreground text-sm">
                        {formatFileSize(uploadResult.fileSize)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Disc3 className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                      <Badge variant="secondary" className="text-[10px] uppercase">
                        {form.getValues("format")}
                      </Badge>
                    </div>
                    {form.getValues("duration") && (
                      <div className="flex items-center gap-2">
                        <Clock className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                        <span className="text-muted-foreground text-sm">
                          {formatDuration(form.getValues("duration")!)}
                        </span>
                      </div>
                    )}
                    {form.getValues("bitrate") && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">
                          {form.getValues("bitrate")} kbps
                        </span>
                      </div>
                    )}
                    <Separator />
                    <code className="text-muted-foreground/60 block font-mono text-[11px] break-all">
                      {uploadResult.r2Key}
                    </code>
                  </div>
                </div>
              )}

              {/* Publishing Options */}
              <div className="border-border bg-card space-y-4 rounded-xl border p-5">
                <p className="text-foreground text-sm font-semibold">Publishing</p>

                <FormField
                  control={form.control}
                  name="isExclusive"
                  render={({ field }) => (
                    <FormItem className="flex items-start gap-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="isExclusive"
                        />
                      </FormControl>
                      <div>
                        <Label htmlFor="isExclusive" className="cursor-pointer text-sm">
                          Exclusive / Premium
                        </Label>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          Requires purchase to download
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch("isExclusive") && (
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (Naira)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step={50}
                            placeholder="100"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="enableDownload"
                  render={({ field }) => (
                    <FormItem className="flex items-start gap-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="enableDownload"
                        />
                      </FormControl>
                      <div>
                        <Label htmlFor="enableDownload" className="cursor-pointer text-sm">
                          Allow downloads
                        </Label>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          Disable for premium releases
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                <Separator />

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !uploadResult}
                    className="bg-brand hover:bg-brand/90 text-brand-foreground w-full gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {isSubmitting ? "Saving..." : "Save Track"}
                  </Button>
                  <Link href="/admin/music" className="w-full">
                    <Button type="button" variant="outline" className="w-full">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Form>

      {/* Cover Art Picker Modal */}
      <MediaPickerModal
        open={showCoverPicker}
        onClose={() => setShowCoverPicker(false)}
        onSelect={handleCoverArtSelect}
        allowedTypes={["IMAGE"]}
      />
    </div>
  );
}
