"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft, Loader2, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { generateSlug } from "@/lib/utils";

const postSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
  excerpt: z.string().max(300).optional(),
  body: z.string().min(1, "Body is required"),
  type: z.enum(["NEWS", "MUSIC", "GIST", "ALBUM", "VIDEO", "LYRICS"]),
  status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]),
  publishedAt: z.string().optional(),
  coverImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  categoryId: z.string().optional(),
  authorId: z.string().min(1, "Author is required"),
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
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: unknown;
  type: string;
  status: string;
  publishedAt: string | null;
  coverImage: string | null;
  categoryId: string | null;
  authorId: string;
  views: number;
  createdAt: string;
}

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

function extractBodyText(body: unknown): string {
  if (typeof body === "string") return body;
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    if (Array.isArray(b.content)) {
      return b.content
        .flatMap((block: unknown) => {
          if (block && typeof block === "object") {
            const blk = block as Record<string, unknown>;
            if (Array.isArray(blk.content)) {
              return blk.content
                .filter(
                  (n: unknown): n is Record<string, unknown> => typeof n === "object" && n !== null
                )
                .map((n: Record<string, unknown>) => n.text ?? "");
            }
          }
          return [];
        })
        .join("\n\n");
    }
  }
  return "";
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      body: "",
      type: "NEWS",
      status: "DRAFT",
      publishedAt: "",
      coverImage: "",
      categoryId: "",
      authorId: "",
    },
  });

  const titleValue = form.watch("title");

  useEffect(() => {
    if (!slugTouched && titleValue && !post) {
      form.setValue("slug", generateSlug(titleValue), { shouldValidate: true });
    }
  }, [titleValue, slugTouched, post, form]);

  useEffect(() => {
    async function loadData() {
      try {
        const [postRes, catRes, userRes] = await Promise.all([
          axios.get<Post>(`/api/admin/posts/${id}`),
          axios.get<{ categories: Category[] }>("/api/categories"),
          axios.get<{ users: User[] }>("/api/admin/users"),
        ]);

        const p = postRes.data;
        setPost(p);
        setCategories(catRes.data.categories ?? []);
        setUsers(userRes.data.users ?? []);

        const bodyText = extractBodyText(p.body);
        const publishedAt = p.publishedAt ? new Date(p.publishedAt).toISOString().slice(0, 16) : "";

        form.reset({
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt ?? "",
          body: bodyText,
          type: p.type as PostFormValues["type"],
          status: p.status as PostFormValues["status"],
          publishedAt,
          coverImage: p.coverImage ?? "",
          categoryId: p.categoryId ?? "",
          authorId: p.authorId,
        });
      } catch {
        toast.error("Failed to load post");
        router.push("/admin/posts");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id, form, router]);

  const onSubmit = async (values: PostFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        body: {
          type: "doc",
          content: [{ type: "paragraph", content: [{ type: "text", text: values.body }] }],
        },
        coverImage: values.coverImage || null,
        categoryId: values.categoryId || null,
        publishedAt: values.publishedAt ? new Date(values.publishedAt).toISOString() : null,
      };
      await axios.put(`/api/admin/posts/${id}`, payload);
      toast.success("Post updated!");
      router.push("/admin/posts");
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? "Failed to update post")
        : "Failed to update post";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Archive this post? It will be hidden from the public.")) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/admin/posts/${id}`);
      toast.success("Post archived");
      router.push("/admin/posts");
    } catch {
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/posts">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-foreground text-2xl font-black">Edit Post</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {post?.views.toLocaleString() ?? 0} views
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {post?.status === "PUBLISHED" && (
            <Link href={`/${post.slug}`} target="_blank">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                View Live
              </Button>
            </Link>
          )}
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1.5"
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
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title *</FormLabel>
                <FormControl>
                  <Input placeholder="Post title..." {...field} className="text-base" />
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
                <FormLabel>Slug *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="post-slug"
                    {...field}
                    onChange={(e) => {
                      setSlugTouched(true);
                      field.onChange(e);
                    }}
                  />
                </FormControl>
                <p className="text-muted-foreground text-xs">URL: /{field.value}</p>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Type + Status */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
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
          </div>

          {/* Category + Author */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
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
                  <FormLabel>Author *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
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

          {/* Publish Date */}
          <FormField
            control={form.control}
            name="publishedAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Publish Date</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Cover Image */}
          <FormField
            control={form.control}
            name="coverImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cover Image URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://cdn.soundloadedblog.ng/..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Excerpt */}
          <FormField
            control={form.control}
            name="excerpt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Excerpt</FormLabel>
                <FormControl>
                  <Textarea placeholder="Short description..." rows={3} {...field} />
                </FormControl>
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
                <FormLabel>Body *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Post content..."
                    rows={16}
                    className="resize-y font-mono text-sm"
                    {...field}
                  />
                </FormControl>
                <p className="text-muted-foreground text-xs">Rich text editor coming soon.</p>
                <FormMessage />
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
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
            <Link href="/admin/posts">
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
