"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Loader2, X, ImagePlus, Paperclip, Music, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Label } from "@/components/ui/label";
import { MediaPickerModal } from "@/components/admin/MediaPickerModal";
import { Checkbox } from "@/components/ui/checkbox";
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

const postSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
  excerpt: z.string().max(300, "Excerpt max 300 chars").optional(),
  body: z
    .any()
    .refine(
      (v) => v && typeof v === "object" && Array.isArray((v as Record<string, unknown>).content),
      "Body is required"
    ),
  type: z.enum(["NEWS", "MUSIC", "GIST", "ALBUM", "VIDEO", "LYRICS"]),
  status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]),
  publishedAt: z.string().optional(),
  coverImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  categoryId: z.string().optional(),
  authorId: z.string().min(1, "Author is required"),
  enableDownload: z.boolean().default(false),
  downloadLabel: z.string().max(120).optional(),
  downloadMediaId: z.string().optional(),
});

type PostFormValues = z.infer<typeof postSchema>;

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  type: "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT";
}

export default function NewPostPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [downloadPickerOpen, setDownloadPickerOpen] = useState(false);
  const [selectedDownload, setSelectedDownload] = useState<MediaItem | null>(null);

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema) as Resolver<PostFormValues>,
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      body: null as unknown as Record<string, unknown>,
      type: "NEWS",
      status: "DRAFT",
      publishedAt: "",
      coverImage: "",
      categoryId: "",
      authorId: "",
      enableDownload: false,
      downloadLabel: "",
      downloadMediaId: "",
    },
  });

  const enableDownload = form.watch("enableDownload");

  const titleValue = form.watch("title");

  useEffect(() => {
    if (!slugTouched && titleValue) {
      form.setValue("slug", generateSlug(titleValue), { shouldValidate: true });
    }
  }, [titleValue, slugTouched, form]);

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, userRes] = await Promise.all([
          axios.get<{ categories: Category[] }>("/api/categories"),
          axios.get<{ users: User[] }>("/api/admin/users"),
        ]);
        setCategories(catRes.data.categories ?? []);
        setUsers(userRes.data.users ?? []);
      } catch {
        // non-blocking
      }
    }
    loadData();
  }, []);

  const onSubmit = async (values: PostFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        body: values.body,
        coverImage: values.coverImage || null,
        categoryId: values.categoryId || null,
        publishedAt: values.publishedAt ? new Date(values.publishedAt).toISOString() : null,
        enableDownload: values.enableDownload,
        downloadLabel: values.downloadLabel?.trim() || null,
        downloadMediaId: values.downloadMediaId || null,
      };
      await axios.post("/api/admin/posts", payload);
      toast.success("Post created successfully!");
      router.push("/admin/posts");
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? "Failed to create post")
        : "Failed to create post";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/posts">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-foreground text-2xl font-black">New Post</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Create a new blog post</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
            {/* ── Left Column: Content ── */}
            <div className="space-y-4">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Post title..."
                        {...field}
                        className="border-none bg-transparent text-xl font-bold shadow-none focus-visible:ring-0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Slug */}
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">URL:</span>
                      <FormControl>
                        <Input
                          placeholder="post-slug-here"
                          {...field}
                          onChange={(e) => {
                            setSlugTouched(true);
                            field.onChange(e);
                          }}
                          className="h-7 border-none bg-transparent text-xs shadow-none focus-visible:ring-0"
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Body */}
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RichTextEditor
                        content={field.value}
                        onChange={field.onChange}
                        placeholder="Write your post content..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ── Right Sidebar ── */}
            <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
              {/* Publish Card */}
              <div className="border-border space-y-3 rounded-lg border p-4">
                <h3 className="text-sm font-semibold">Publish</h3>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"].map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
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
                  name="publishedAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Publish Date</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} className="h-8 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-1">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-brand hover:bg-brand/90 text-brand-foreground h-9 flex-1 gap-2 text-sm"
                  >
                    {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {isSubmitting ? "Creating..." : "Create Post"}
                  </Button>
                  <Link href="/admin/posts">
                    <Button type="button" variant="outline" className="h-9 text-sm">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Post Settings Card */}
              <div className="border-border space-y-3 rounded-lg border p-4">
                <h3 className="text-sm font-semibold">Post Settings</h3>

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {["NEWS", "MUSIC", "GIST", "ALBUM", "VIDEO", "LYRICS"].map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
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
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Category</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val === "__none__" ? "" : val)}
                        defaultValue={field.value || "__none__"}
                      >
                        <FormControl>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
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
                  name="authorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Author</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select author" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name ?? user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Featured Image Card */}
              <div className="border-border space-y-3 rounded-lg border p-4">
                <h3 className="text-sm font-semibold">Featured Image</h3>
                <FormField
                  control={form.control}
                  name="coverImage"
                  render={({ field }) => (
                    <FormItem>
                      {field.value ? (
                        <div className="relative">
                          <div className="bg-muted aspect-video w-full overflow-hidden rounded-lg border">
                            <Image
                              src={field.value}
                              alt="Cover"
                              width={340}
                              height={191}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => field.onChange("")}
                            className="bg-destructive text-destructive-foreground absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full shadow-sm"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setMediaPickerOpen(true)}
                          className="border-border bg-muted/30 hover:bg-muted/60 flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors"
                        >
                          <ImagePlus className="text-muted-foreground h-6 w-6" />
                          <span className="text-muted-foreground text-xs font-medium">
                            Set Featured Image
                          </span>
                        </button>
                      )}
                      <FormControl>
                        <Input type="hidden" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <MediaPickerModal
                open={mediaPickerOpen}
                onClose={() => setMediaPickerOpen(false)}
                onSelect={(media) => {
                  const item = Array.isArray(media) ? media[0] : media;
                  form.setValue("coverImage", item.url, { shouldDirty: true });
                }}
                allowedTypes={["IMAGE"]}
              />

              {/* Excerpt Card */}
              <div className="border-border space-y-3 rounded-lg border p-4">
                <h3 className="text-sm font-semibold">Excerpt</h3>
                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Short description for SEO and previews..."
                          rows={2}
                          className="text-xs"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Download Attachment Card */}
              <div className="border-border space-y-3 rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold">Download</h3>
                  <FormField
                    control={form.control}
                    name="enableDownload"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <Label className="text-xs">Enable</Label>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="downloadMediaId"
                  render={({ field }) => (
                    <FormItem>
                      <div className="space-y-2">
                        {selectedDownload ? (
                          <div className="bg-muted/40 flex items-center justify-between rounded-lg border px-3 py-2">
                            <div className="flex items-center gap-2">
                              {selectedDownload.type === "AUDIO" ? (
                                <Music className="text-muted-foreground h-3.5 w-3.5" />
                              ) : (
                                <FileText className="text-muted-foreground h-3.5 w-3.5" />
                              )}
                              <span className="truncate text-xs font-medium">
                                {selectedDownload.filename}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                setSelectedDownload(null);
                                field.onChange("");
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-8 w-full justify-start gap-2 text-xs"
                            onClick={() => setDownloadPickerOpen(true)}
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                            Select file
                          </Button>
                        )}
                        <FormControl>
                          <Input type="hidden" {...field} />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="downloadLabel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Button Label</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Download Press Kit"
                          className="h-8 text-xs"
                          {...field}
                          disabled={!enableDownload}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <MediaPickerModal
                open={downloadPickerOpen}
                onClose={() => setDownloadPickerOpen(false)}
                onSelect={(media) => {
                  const item = Array.isArray(media) ? media[0] : media;
                  setSelectedDownload(item);
                  form.setValue("downloadMediaId", item.id, { shouldDirty: true });
                }}
                allowedTypes={["AUDIO", "DOCUMENT"]}
              />
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
