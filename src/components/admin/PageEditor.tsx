"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ChevronDown,
  ExternalLink,
  Globe,
  ImagePlus,
  Loader2,
  Search,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { adminApi, getApiError } from "@/lib/admin-api";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { MediaPickerModal } from "@/components/admin/MediaPickerModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn, generateSlug } from "@/lib/utils";

const PAGE_TEMPLATES = [
  { value: "DEFAULT", label: "Default" },
  { value: "LEGAL", label: "Legal" },
  { value: "CONTACT", label: "Contact" },
  { value: "FULL_WIDTH", label: "Full Width" },
] as const;

const pageSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "URL path must be at least 2 characters")
    .regex(/^[a-z0-9]+(?:[/-][a-z0-9]+)*$/, "Use lowercase letters, numbers, hyphens, and /"),
  excerpt: z.string().max(300, "Excerpt max 300 chars").optional(),
  body: z
    .any()
    .refine(
      (value) =>
        value &&
        typeof value === "object" &&
        Array.isArray((value as Record<string, unknown>).content),
      "Body is required"
    ),
  status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]),
  publishedAt: z.string().optional(),
  template: z.enum(["DEFAULT", "LEGAL", "CONTACT", "FULL_WIDTH"]),
  coverImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  authorId: z.string().optional(),
  showInHeader: z.boolean().default(false),
  showInFooter: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).max(10000).default(0),
  metaTitle: z.string().max(70, "Meta title max 70 chars").optional(),
  metaDescription: z.string().max(160, "Meta description max 160 chars").optional(),
  focusKeyword: z.string().max(80).optional(),
});

type PageFormValues = z.infer<typeof pageSchema>;

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface PageEditorProps {
  mode: "create" | "edit";
  pageId?: string;
  defaultValues?: Partial<PageFormValues>;
  page?: {
    slug: string;
    status: string;
    views: number;
    isSystem: boolean;
  } | null;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20" },
  PUBLISHED: {
    label: "Published",
    className: "bg-green-500/15 text-green-600 border-green-500/20",
  },
  SCHEDULED: { label: "Scheduled", className: "bg-blue-500/15 text-blue-600 border-blue-500/20" },
  ARCHIVED: { label: "Archived", className: "bg-muted text-muted-foreground border-border" },
};

function PanelSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: React.ReactNode;
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

export function PageEditor({ mode, pageId, defaultValues, page }: PageEditorProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const sessionUserId = (session?.user as { id?: string } | undefined)?.id ?? "";

  const [users, setUsers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  const resolvedDefaults = useMemo(
    () => ({
      title: "",
      slug: "",
      excerpt: "",
      body: { type: "doc", content: [{ type: "paragraph" }] },
      status: "DRAFT" as const,
      publishedAt: "",
      template: "DEFAULT" as const,
      coverImage: "",
      authorId: defaultValues?.authorId || sessionUserId,
      showInHeader: false,
      showInFooter: false,
      sortOrder: 0,
      metaTitle: "",
      metaDescription: "",
      focusKeyword: "",
      ...defaultValues,
    }),
    // defaultValues is stable from route load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [defaultValues?.authorId, sessionUserId]
  );

  const form = useForm<PageFormValues>({
    resolver: zodResolver(pageSchema) as Resolver<PageFormValues>,
    defaultValues: resolvedDefaults,
  });

  const statusValue = form.watch("status");
  const titleValue = form.watch("title");
  const statusBadge = STATUS_BADGE[statusValue] ?? STATUS_BADGE.DRAFT;
  const isDirty = form.formState.isDirty;

  useEffect(() => {
    if (mode === "create" && sessionUserId && !form.getValues("authorId")) {
      form.setValue("authorId", sessionUserId);
    }
  }, [form, mode, sessionUserId]);

  useEffect(() => {
    if (!slugTouched && titleValue) {
      form.setValue("slug", generateSlug(titleValue), { shouldValidate: true });
    }
  }, [form, slugTouched, titleValue]);

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await adminApi.get<{ users: User[] }>("/api/admin/users");
        setUsers(res.data.users ?? []);
      } catch {
        // non-blocking
      }
    }
    loadUsers();
  }, []);

  const onSubmit = useCallback(
    async (values: PageFormValues) => {
      setIsSubmitting(true);
      try {
        const payload = {
          ...values,
          coverImage: values.coverImage || null,
          authorId: values.authorId || null,
          publishedAt: values.publishedAt ? new Date(values.publishedAt).toISOString() : null,
          excerpt: values.excerpt?.trim() || null,
          metaTitle: values.metaTitle?.trim() || null,
          metaDescription: values.metaDescription?.trim() || null,
          focusKeyword: values.focusKeyword?.trim() || null,
        };

        if (mode === "create") {
          await adminApi.post("/api/admin/pages", payload);
          toast.success("Page created");
        } else {
          await adminApi.put(`/api/admin/pages/${pageId}`, payload);
          toast.success("Page saved");
        }

        router.push("/admin/pages");
      } catch (error) {
        toast.error(getApiError(error, `Failed to ${mode === "create" ? "create" : "save"} page`));
      } finally {
        setIsSubmitting(false);
      }
    },
    [mode, pageId, router]
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
    if (!pageId || !confirm("Archive this page? It will be hidden from the public site.")) return;
    setIsDeleting(true);
    try {
      await adminApi.delete(`/api/admin/pages/${pageId}`);
      toast.success(page?.isSystem ? "System page archived" : "Page archived");
      router.push("/admin/pages");
    } catch (error) {
      toast.error(getApiError(error, "Failed to archive page"));
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
        <div className="border-border bg-background flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2.5">
          <div className="flex items-center gap-3">
            <Link href="/admin/pages">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to pages</span>
              </Button>
            </Link>
            <Badge
              variant="outline"
              className={cn("text-[11px] tracking-wide uppercase", statusBadge.className)}
            >
              {statusBadge.label}
            </Badge>
            {page?.isSystem && (
              <Badge variant="secondary" className="text-[11px] uppercase">
                System
              </Badge>
            )}
            {isDirty && <span className="text-muted-foreground text-[11px]">Unsaved changes</span>}
            {mode === "edit" && page && (
              <span className="text-muted-foreground hidden text-[11px] sm:inline">
                {page.views.toLocaleString()} views
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {mode === "edit" && page?.status === "PUBLISHED" && (
              <Link href={`/${page.slug}`} target="_blank">
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
              Save Draft
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-brand hover:bg-brand/90 text-brand-foreground gap-1.5 text-xs"
              onClick={handlePublish}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
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

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <textarea
                        placeholder="Add page title"
                        {...field}
                        rows={1}
                        className="text-foreground placeholder:text-muted-foreground/40 w-full resize-none border-none bg-transparent text-3xl font-extrabold tracking-tight focus:outline-none"
                        onInput={(event) => {
                          const el = event.target as HTMLTextAreaElement;
                          el.style.height = "auto";
                          el.style.height = `${el.scrollHeight}px`;
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                          placeholder="about"
                          {...field}
                          onChange={(event) => {
                            setSlugTouched(true);
                            field.onChange(normalizeInputSlug(event.target.value));
                          }}
                          className="text-muted-foreground focus:text-foreground flex-1 border-none bg-transparent text-xs focus:outline-none"
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RichTextEditor
                        content={field.value}
                        onChange={field.onChange}
                        placeholder="Write the page content..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div
            className={cn(
              "border-border bg-background shrink-0 overflow-y-auto border-l transition-[width,opacity] duration-200 ease-in-out",
              settingsOpen ? "w-[320px] opacity-100" : "w-0 overflow-hidden opacity-0"
            )}
          >
            <div className="w-[320px] px-5 py-4">
              <h2 className="text-foreground mb-1 text-sm font-bold">Page Settings</h2>
              <p className="text-muted-foreground mb-4 text-[11px]">
                Configure publishing, layout, navigation, and SEO.
              </p>
              <Separator />

              <PanelSection title="Status & Publishing">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground text-xs">Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"].map((status) => (
                            <SelectItem key={status} value={status} className="text-xs">
                              {status.charAt(0) + status.slice(1).toLowerCase()}
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
                      <FormLabel className="text-muted-foreground text-xs">Owner</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select owner" />
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

              <PanelSection title="Layout">
                <FormField
                  control={form.control}
                  name="template"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground text-xs">Template</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PAGE_TEMPLATES.map((template) => (
                            <SelectItem
                              key={template.value}
                              value={template.value}
                              className="text-xs"
                            >
                              {template.label}
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
                  name="coverImage"
                  render={({ field }) => (
                    <FormItem>
                      {field.value ? (
                        <div className="group relative">
                          <div className="bg-muted aspect-video w-full overflow-hidden rounded-lg border">
                            <Image
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
                            Set page image
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

              <PanelSection title="Navigation">
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="showInHeader"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between gap-3 space-y-0">
                        <Label className="text-xs">Show in header</Label>
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="showInFooter"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between gap-3 space-y-0">
                        <Label className="text-xs">Show in footer</Label>
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sortOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground text-xs">Sort Order</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={10000}
                            {...field}
                            className="h-8 text-xs"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </PanelSection>

              <Separator />

              <PanelSection title="Excerpt">
                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Short page summary..."
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

              <PanelSection title="SEO" defaultOpen={false}>
                <div className="mb-1 flex items-center gap-1.5">
                  <Search className="text-muted-foreground h-3 w-3" />
                  <span className="text-muted-foreground text-[10px]">
                    Override generated page metadata
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
                          placeholder={form.getValues("excerpt") || "SEO description..."}
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
                          placeholder="e.g. about soundloaded"
                          className="h-8 text-xs"
                          {...field}
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

        <MediaPickerModal
          open={mediaPickerOpen}
          onClose={() => setMediaPickerOpen(false)}
          onSelect={(media) => {
            const item = Array.isArray(media) ? media[0] : media;
            form.setValue("coverImage", item.url, { shouldDirty: true });
          }}
          allowedTypes={["IMAGE"]}
        />
      </form>
    </Form>
  );
}

function normalizeInputSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .map((segment) => generateSlug(segment))
    .filter(Boolean)
    .join("/");
}
