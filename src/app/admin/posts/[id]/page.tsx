"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/admin-api";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { PostEditor } from "@/components/admin/PostEditor";
import { isLexicalFormat, convertLexicalToTiptap } from "@/lib/editor-compat";

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
  enableDownload: boolean;
  downloadLabel: string | null;
  downloadMediaId: string | null;
  downloadMedia?: {
    id: string;
    filename: string;
    url: string;
    type: "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT";
  } | null;
  metaTitle: string | null;
  metaDescription: string | null;
  focusKeyword: string | null;
}

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPost() {
      try {
        const res = await adminApi.get<Post>(`/api/admin/posts/${id}`);
        setPost(res.data);
      } catch {
        toast.error("Failed to load post");
        router.push("/admin/posts");
      } finally {
        setIsLoading(false);
      }
    }
    loadPost();
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!post) return null;

  const bodyJson = isLexicalFormat(post.body) ? convertLexicalToTiptap(post.body) : post.body;

  const publishedAt = post.publishedAt ? new Date(post.publishedAt).toISOString().slice(0, 16) : "";

  return (
    <PostEditor
      mode="edit"
      postId={id}
      defaultValues={{
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? "",
        body: bodyJson ?? { type: "doc", content: [{ type: "paragraph" }] },
        type: post.type as "NEWS" | "MUSIC" | "GIST" | "ALBUM" | "VIDEO" | "LYRICS",
        status: post.status as "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED",
        publishedAt,
        coverImage: post.coverImage ?? "",
        categoryId: post.categoryId ?? "",
        authorId: post.authorId,
        enableDownload: post.enableDownload ?? false,
        downloadLabel: post.downloadLabel ?? "",
        downloadMediaId: post.downloadMediaId ?? "",
        metaTitle: post.metaTitle ?? "",
        metaDescription: post.metaDescription ?? "",
        focusKeyword: post.focusKeyword ?? "",
      }}
      post={{
        views: post.views,
        status: post.status,
        slug: post.slug,
        downloadMedia: post.downloadMedia ?? null,
      }}
    />
  );
}
