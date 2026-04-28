"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { PageEditor } from "@/components/admin/PageEditor";
import { adminApi } from "@/lib/admin-api";
import { convertLexicalToTiptap, isLexicalFormat } from "@/lib/editor-compat";

interface PageRecord {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: unknown;
  coverImage: string | null;
  status: string;
  template: "DEFAULT" | "LEGAL" | "CONTACT" | "FULL_WIDTH";
  publishedAt: string | null;
  authorId: string | null;
  showInHeader: boolean;
  showInFooter: boolean;
  sortOrder: number;
  views: number;
  isSystem: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  focusKeyword: string | null;
}

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default function EditPagePage({ params }: EditPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [page, setPage] = useState<PageRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPage() {
      try {
        const res = await adminApi.get<PageRecord>(`/api/admin/pages/${id}`);
        setPage(res.data);
      } catch {
        toast.error("Failed to load page");
        router.push("/admin/pages");
      } finally {
        setIsLoading(false);
      }
    }
    loadPage();
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!page) return null;

  const bodyJson = isLexicalFormat(page.body) ? convertLexicalToTiptap(page.body) : page.body;
  const publishedAt = page.publishedAt ? new Date(page.publishedAt).toISOString().slice(0, 16) : "";

  return (
    <PageEditor
      mode="edit"
      pageId={id}
      defaultValues={{
        title: page.title,
        slug: page.slug,
        excerpt: page.excerpt ?? "",
        body: bodyJson ?? { type: "doc", content: [{ type: "paragraph" }] },
        coverImage: page.coverImage ?? "",
        status: page.status as "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED",
        template: page.template,
        publishedAt,
        authorId: page.authorId ?? "",
        showInHeader: page.showInHeader,
        showInFooter: page.showInFooter,
        sortOrder: page.sortOrder,
        metaTitle: page.metaTitle ?? "",
        metaDescription: page.metaDescription ?? "",
        focusKeyword: page.focusKeyword ?? "",
      }}
      page={{
        slug: page.slug,
        status: page.status,
        views: page.views,
        isSystem: page.isSystem,
      }}
    />
  );
}
