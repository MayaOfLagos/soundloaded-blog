"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft, Loader2, Upload, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import { generateSlug } from "@/lib/utils";

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
  r2Key: z.string().min(1, "R2 key is required"),
  filename: z.string().min(1, "Filename is required"),
  fileSize: z.coerce.number().int().positive("File size must be positive"),
  duration: z.coerce.number().int().positive().optional(),
  bitrate: z.coerce.number().int().positive().optional(),
  trackNumber: z.coerce.number().int().positive().optional(),
  coverArt: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  label: z.string().optional(),
  isExclusive: z.boolean(),
});

type MusicFormValues = z.infer<typeof musicSchema>;

interface Artist {
  id: string;
  name: string;
  slug: string;
}

interface Album {
  id: string;
  title: string;
  artistId: string;
}

export default function MusicUploadPage() {
  const router = useRouter();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [filteredAlbums, setFilteredAlbums] = useState<Album[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

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
      bitrate: 320,
      trackNumber: undefined,
      coverArt: "",
      label: "",
      isExclusive: false,
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
          axios.get<{ artists: Artist[] }>("/api/artists"),
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

  const onSubmit = async (values: MusicFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        albumId: values.albumId || null,
        genre: values.genre || null,
        coverArt: values.coverArt || null,
        label: values.label || null,
        fileSize: BigInt(values.fileSize).toString(),
      };
      await axios.post("/api/admin/music", payload);
      toast.success("Music track saved successfully!");
      router.push("/admin/music");
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? "Failed to save music track")
        : "Failed to save music track";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/music">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-foreground text-2xl font-black">Upload Music</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Save music metadata — file upload via R2 presigned URL
          </p>
        </div>
      </div>

      {/* R2 info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
        <div className="text-sm text-blue-600 dark:text-blue-400">
          <p className="font-medium">File Upload Instructions</p>
          <p className="mt-1 text-xs opacity-80">
            Upload your audio file to the <code className="font-mono">soundloadedblog-music</code>{" "}
            R2 bucket first, then enter the R2 object key (e.g.{" "}
            <code className="font-mono">tracks/artist-name/song-title.mp3</code>) below. Presigned
            URL generation is handled by <code className="font-mono">/api/music/[id]/stream</code>.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Title + Slug */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
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
                  <FormLabel>Artist *</FormLabel>
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
                  <FormLabel>Album (optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="No album" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No album (single)</SelectItem>
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

          {/* Genre + Year */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="genre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Genre</FormLabel>
                  <FormControl>
                    <Input placeholder="Afrobeats, Highlife, Hip-Hop..." {...field} />
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
                  <FormLabel>Year</FormLabel>
                  <FormControl>
                    <Input type="number" min={1900} max={2100} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* R2 Key + Filename */}
          <FormField
            control={form.control}
            name="r2Key"
            render={({ field }) => (
              <FormItem>
                <FormLabel>R2 Object Key *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="tracks/artist-name/song-title.mp3"
                    className="font-mono"
                    {...field}
                  />
                </FormControl>
                <p className="text-muted-foreground text-xs">
                  The full key path in the soundloadedblog-music R2 bucket
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="filename"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Filename *</FormLabel>
                <FormControl>
                  <Input placeholder="song-title.mp3" className="font-mono" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Format + File Size */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Format *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {["MP3", "FLAC", "WAV", "AAC", "OGG"].map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
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
              name="fileSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File Size (bytes) *</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} placeholder="5242880" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Duration + Bitrate + Track Number */}
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (secs)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} placeholder="210" {...field} />
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
                  <FormLabel>Bitrate (kbps)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} placeholder="320" {...field} />
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
                  <FormLabel>Track #</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} placeholder="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Cover Art + Label */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="coverArt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Art URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://cdn.soundloadedblog.ng/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input placeholder="Record label..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Is Exclusive */}
          <FormField
            control={form.control}
            name="isExclusive"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    id="isExclusive"
                  />
                </FormControl>
                <Label htmlFor="isExclusive" className="cursor-pointer">
                  Exclusive to Soundloaded
                  <span className="text-muted-foreground ml-2 text-xs">
                    (shows exclusive badge on track page)
                  </span>
                </Label>
              </FormItem>
            )}
          />

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-brand hover:bg-brand/90 text-brand-foreground gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isSubmitting ? "Saving..." : "Save Track"}
            </Button>
            <Link href="/admin/music">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
}
