"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import axios from "axios";
import Link from "next/link";
import NextImage from "next/image";
import {
  ArrowLeft,
  Loader2,
  Trash2,
  ExternalLink,
  X,
  ImagePlus,
  Paperclip,
  Music,
  FileText,
  Settings,
  Eye,
  ChevronDown,
  Globe,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { MediaPickerModal } from "@/components/admin/MediaPickerModal";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn, generateSlug } from "@/lib/utils";

// ─── Schema ─────────────────────────────────────────────────────────────────

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
  metaTitle: z.string().max(70, "Meta title max 70 chars").optional(),
  metaDescription: z.string().max(160, "Meta description max 160 chars").optional(),
  focusKeyword: z.string().max(80).optional(),
});

type PostFormValues = z.infer<typeof postSchema>;

// ─── Types ──────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  type: "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT";
}

interface PostEditorProps {
  mode: "create" | "edit";
  postId?: string;
  defaultValues?: Partial<PostFormValues>;
  post?: {
    views: number;
    status: string;
    slug: string;
    downloadMedia?: MediaItem | null;
  } | null;
}

// ─── Status helpers ─────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20" },
  PUBLISHED: {
    label: "Published",
    className: "bg-green-500/15 text-green-600 border-green-500/20",
  },
  SCHEDULED: { label: "Scheduled", className: "bg-blue-500/15 text-blue-600 border-blue-500/20" },
  ARCHIVED: { label: "Archived", className: "bg-muted text-muted-foreground border-border" },
};

// ─── Collapsible Settings Panel Section ─────────────────────────────────────

function PanelSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="text-foreground hover:text-foreground/80 flex w-full items-center justify-between py-3 text-[13px] font-semibold transition-colors">
        {title}
        <ChevronDown className="text-muted-foreground h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-3 pb-3">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── PostEditor ─────────────────────────────────────────────────────────────

export function PostEditor({ mode, postId, defaultValues, post }: PostEditorProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const sessionUserId = (session?.user as { id?: string } | undefined)?.id ?? "";

  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [downloadPickerOpen, setDownloadPickerOpen] = useState(false);
  const [selectedDownload, setSelectedDownload] = useState<MediaItem | null>(
    post?.downloadMedia ?? null
  );

  const resolvedDefaults = useMemo(
    () => ({
      title: "",
      slug: "",
      excerpt: "",
      body: null as unknown as Record<string, unknown>,
      type: "NEWS" as const,
      status: "DRAFT" as const,
      publishedAt: "",
      coverImage: "",
      categoryId: "",
      authorId: defaultValues?.authorId || sessionUserId,
      enableDownload: false,
      downloadLabel: "",
      downloadMediaId: "",
      metaTitle: "",
      metaDescription: "",
      focusKeyword: "",
      ...defaultValues,
    }),
    // Only compute once — defaultValues is stable from the parent
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [defaultValues?.authorId, sessionUserId]
  );

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema) as Resolver<PostFormValues>,
    defaultValues: resolvedDefaults,
  });

  // Auto-select current user as author when session loads (create mode only)
  useEffect(() => {
    if (mode === "create" && sessionUserId && !form.getValues("authorId")) {
      form.setValue("authorId", sessionUserId);
    }
  }, [mode, sessionUserId, form]);

  const statusValue = form.watch("status");
  const enableDownload = form.watch("enableDownload");
  const titleValue = form.watch("title");
  const isDirty = form.formState.isDirty;
  const statusBadge = STATUS_BADGE[statusValue] ?? STATUS_BADGE.DRAFT;

  // Auto-generate slug from title (new post only)
  useEffect(() => {
    if (!slugTouched && titleValue) {
      form.setValue("slug", generateSlug(titleValue), { shouldValidate: true });
    }
  }, [titleValue, slugTouched, form]);

  // Load categories & users
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

  const onSubmit = useCallback(
    async (values: PostFormValues) => {
      setIsSubmitting(true);
      try {
        const payload = {
          ...values,
          coverImage: values.coverImage || null,
          categoryId: values.categoryId || null,
          publishedAt: values.publishedAt ? new Date(values.publishedAt).toISOString() : null,
          downloadLabel: values.downloadLabel?.trim() || null,
          downloadMediaId: values.downloadMediaId || null,
          metaTitle: values.metaTitle?.trim() || null,
          metaDescription: values.metaDescription?.trim() || null,
          focusKeyword: values.focusKeyword?.trim() || null,
        };

        if (mode === "create") {
          await axios.post("/api/admin/posts", payload);
          toast.success("Post created!");
        } else {
          await axios.put(`/api/admin/posts/${postId}`, payload);
          toast.success("Post saved!");
        }
        router.push("/admin/posts");
      } catch (err) {
        const msg = axios.isAxiosError(err)
          ? (err.response?.data?.error ?? `Failed to ${mode === "create" ? "create" : "save"} post`)
          : `Failed to ${mode === "create" ? "create" : "save"} post`;
        toast.error(typeof msg === "string" ? msg : "Something went wrong");
      } finally {
        setIsSubmitting(false);
      }
    },
    [mode, postId, router]
  );

  const handleSaveDraft = useCallback(() => {
    form.setValue("status", "DRAFT");
    form.handleSubmit(onSubmit)();
  }, [form, onSubmit]);

  const handlePublish = useCallback(() => {
    form.setValue("status", "PUBLISHED");
    form.handleSubmit(onSubmit)();
  }, [form, onSubmit]);

  const handleDelete = async () => {
    if (!confirm("Archive this post? It will be hidden from the public.")) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/admin/posts/${postId}`);
      toast.success("Post archived");
      router.push("/admin/posts");
    } catch {
      toast.error("Failed to archive post");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="-m-4 flex h-[calc(100vh-3.5rem)] flex-col md:-m-6"
      >
        {/* ─── Top Bar ──────────────────────────────────────────────── */}
        <div className="border-border bg-background flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2.5">
          {/* Left: Back + status */}
          <div className="flex items-center gap-3">
            <Link href="/admin/posts">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to posts</span>
              </Button>
            </Link>

            <Badge
              variant="outline"
              className={cn("text-[11px] tracking-wide uppercase", statusBadge.className)}
            >
              {statusBadge.label}
            </Badge>

            {isDirty && <span className="text-muted-foreground text-[11px]">Unsaved changes</span>}

            {mode === "edit" && post && (
              <span className="text-muted-foreground hidden text-[11px] sm:inline">
                <Eye className="mr-1 inline h-3 w-3" />
                {post.views.toLocaleString()} views
              </span>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {mode === "edit" && post?.status === "PUBLISHED" && (
              <Link href={`/${post.slug}`} target="_blank">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="hidden gap-1.5 text-xs sm:flex"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Live
                </Button>
              </Link>
            )}

            {mode === "edit" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hidden gap-1.5 text-xs sm:flex"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Archive
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
            >
              {isSubmitting && statusValue === "DRAFT" && (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              )}
              Save Draft
            </Button>

            <Button
              type="button"
              size="sm"
              className="bg-brand hover:bg-brand/90 text-brand-foreground gap-1.5 text-xs"
              onClick={handlePublish}
              disabled={isSubmitting}
            >
              {isSubmitting && statusValue === "PUBLISHED" && (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              )}
              <Globe className="h-3.5 w-3.5" />
              {mode === "create" ? "Publish" : "Update"}
            </Button>

            <Separator orientation="vertical" className="mx-0.5 h-6" />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", settingsOpen && "bg-accent text-accent-foreground")}
              onClick={() => setSettingsOpen(!settingsOpen)}
              title="Toggle settings panel"
            >
              <Settings className="h-4 w-4" />
              <span className="sr-only">Toggle settings</span>
            </Button>
          </div>
        </div>

        {/* ─── Content Area ────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Editor Canvas */}
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <textarea
                        placeholder="Add title"
                        {...field}
                        rows={1}
                        className="text-foreground placeholder:text-muted-foreground/40 w-full resize-none border-none bg-transparent text-3xl font-extrabold tracking-tight focus:outline-none"
                        onInput={(e) => {
                          const el = e.target as HTMLTextAreaElement;
                          el.style.height = "auto";
                          el.style.height = el.scrollHeight + "px";
                        }}
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
                  <FormItem className="mt-1 mb-6">
                    <div className="flex items-center gap-1.5">
                      <Globe className="text-muted-foreground/50 h-3 w-3" />
                      <span className="text-muted-foreground/50 text-xs">soundloaded.ng/</span>
                      <FormControl>
                        <input
                          placeholder="post-slug"
                          {...field}
                          onChange={(e) => {
                            setSlugTouched(true);
                            field.onChange(e);
                          }}
                          className="text-muted-foreground focus:text-foreground flex-1 border-none bg-transparent text-xs focus:outline-none"
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
                        placeholder="Start writing..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* ─── Settings Panel ──────────────────────────────────── */}
          <div
            className={cn(
              "border-border bg-background shrink-0 overflow-y-auto border-l transition-[width,opacity] duration-200 ease-in-out",
              settingsOpen ? "w-[320px] opacity-100" : "w-0 overflow-hidden opacity-0"
            )}
          >
            <div className="w-[320px] px-5 py-4">
              <h2 className="text-foreground mb-1 text-sm font-bold">Post Settings</h2>
              <p className="text-muted-foreground mb-4 text-[11px]">
                Configure your post before publishing
              </p>

              <Separator />

              {/* Status & Visibility */}
              <PanelSection title="Status & Visibility">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground text-xs">Visibility</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"].map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">
                              {s.charAt(0) + s.slice(1).toLowerCase()}
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
                      <FormLabel className="text-muted-foreground text-xs">Publish Date</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} className="h-8 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="authorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground text-xs">Author</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select author" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id} className="text-xs">
                              {user.name ?? user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </PanelSection>

              <Separator />

              {/* Post Type & Category */}
              <PanelSection title="Type & Category">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground text-xs">Post Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {["NEWS", "MUSIC", "GIST", "ALBUM", "VIDEO", "LYRICS"].map((t) => (
                            <SelectItem key={t} value={t} className="text-xs">
                              {t.charAt(0) + t.slice(1).toLowerCase()}
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
                      <FormLabel className="text-muted-foreground text-xs">Category</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val === "__none__" ? "" : val)}
                        value={field.value || "__none__"}
                      >
                        <FormControl>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__" className="text-xs">
                            None
                          </SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id} className="text-xs">
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </PanelSection>

              <Separator />

              {/* Featured Image */}
              <PanelSection title="Featured Image">
                <FormField
                  control={form.control}
                  name="coverImage"
                  render={({ field }) => (
                    <FormItem>
                      {field.value ? (
                        <div className="group relative">
                          <div className="bg-muted aspect-video w-full overflow-hidden rounded-lg border">
                            <NextImage
                              src={field.value}
                              alt="Cover"
                              width={280}
                              height={157}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          </div>
                          <button
                            type="button"
                            title="Remove image"
                            onClick={() => field.onChange("")}
                            className="bg-destructive text-destructive-foreground absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Remove image</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setMediaPickerOpen(true)}
                          className="border-border bg-muted/30 hover:bg-muted/60 flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors"
                        >
                          <ImagePlus className="text-muted-foreground h-5 w-5" />
                          <span className="text-muted-foreground text-[11px] font-medium">
                            Click to set featured image
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
              </PanelSection>

              <Separator />

              {/* Excerpt */}
              <PanelSection title="Excerpt">
                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Write a short description for SEO and social previews..."
                          rows={3}
                          className="resize-none text-xs"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-muted-foreground/60 mt-1 text-[10px]">
                        {field.value?.length ?? 0}/300 characters
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </PanelSection>

              <Separator />

              {/* SEO */}
              <PanelSection title="SEO" defaultOpen={false}>
                <div className="mb-1 flex items-center gap-1.5">
                  <Search className="text-muted-foreground h-3 w-3" />
                  <span className="text-muted-foreground text-[10px]">
                    Override auto-generated SEO metadata
                  </span>
                </div>

                <FormField
                  control={form.control}
                  name="metaTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground text-xs">Meta Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={form.getValues("title") || "SEO title..."}
                          className="h-8 text-xs"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-muted-foreground/60 text-[10px]">
                        {field.value?.length ?? 0}/70 characters
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="metaDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground text-xs">
                        Meta Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={
                            form.getValues("excerpt") || "SEO description for search results..."
                          }
                          rows={3}
                          className="resize-none text-xs"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-muted-foreground/60 text-[10px]">
                        {field.value?.length ?? 0}/160 characters
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="focusKeyword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground text-xs">Focus Keyword</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. afrobeats, new music"
                          className="h-8 text-xs"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-muted-foreground/60 text-[10px]">
                        Comma-separated for multiple keywords
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </PanelSection>

              <Separator />

              {/* Download Attachment */}
              <PanelSection title="Download Attachment" defaultOpen={false}>
                <div className="flex items-center justify-between">
                  <FormField
                    control={form.control}
                    name="enableDownload"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <Label className="text-xs">Enable download button</Label>
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
                            <div className="flex min-w-0 items-center gap-2">
                              {selectedDownload.type === "AUDIO" ? (
                                <Music className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                              ) : (
                                <FileText className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                              )}
                              <span className="truncate text-xs font-medium">
                                {selectedDownload.filename}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 shrink-0 p-0"
                              onClick={() => {
                                setSelectedDownload(null);
                                field.onChange("");
                              }}
                            >
                              <X className="h-3 w-3" />
                              <span className="sr-only">Remove file</span>
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
                      <FormLabel className="text-muted-foreground text-xs">Button Label</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Download MP3"
                          className="h-8 text-xs"
                          {...field}
                          disabled={!enableDownload}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </PanelSection>
            </div>
          </div>
        </div>

        {/* ─── Media Picker Modals ──────────────────────────────── */}
        <MediaPickerModal
          open={mediaPickerOpen}
          onClose={() => setMediaPickerOpen(false)}
          onSelect={(media) => {
            const item = Array.isArray(media) ? media[0] : media;
            form.setValue("coverImage", item.url, { shouldDirty: true });
          }}
          allowedTypes={["IMAGE"]}
        />
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
      </form>
    </Form>
  );
}
