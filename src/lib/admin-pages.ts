import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  getPageUrl,
  PAGE_TEMPLATES,
  isReservedPageSlug,
  isValidPageSlug,
  normalizePageSlug,
} from "@/lib/pages";

export const pageSchema = z.object({
  title: z.string().min(1).max(180),
  slug: z.string().min(1).max(240),
  excerpt: z.string().max(300).optional().nullable(),
  body: z.any().optional(),
  coverImage: z.string().url().optional().nullable().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]).default("DRAFT"),
  template: z.enum(PAGE_TEMPLATES.map((template) => template.value) as [string, ...string[]]),
  publishedAt: z.string().optional().nullable(),
  authorId: z.string().optional().nullable(),
  showInHeader: z.boolean().optional().default(false),
  showInFooter: z.boolean().optional().default(false),
  sortOrder: z.number().int().min(0).max(10000).optional().default(0),
  metaTitle: z.string().max(70).optional().nullable(),
  metaDescription: z.string().max(160).optional().nullable(),
  focusKeyword: z.string().max(80).optional().nullable(),
});

export type PagePayload = z.infer<typeof pageSchema>;

export async function validatePageSlug(slugValue: string, currentPageId?: string) {
  const slug = normalizePageSlug(slugValue);

  if (!slug || !isValidPageSlug(slug)) {
    throw new PageValidationError("Use lowercase letters, numbers, hyphens, and slashes only.");
  }

  if (isReservedPageSlug(slug)) {
    throw new PageValidationError(`/${slug.split("/")[0]} is reserved by the application.`);
  }

  const [pageConflict, postConflict] = await Promise.all([
    db.page.findUnique({ where: { slug }, select: { id: true } }),
    db.post.findUnique({ where: { slug }, select: { id: true } }),
  ]);

  if (pageConflict && pageConflict.id !== currentPageId) {
    throw new PageValidationError("A page already uses this URL.");
  }

  if (postConflict) {
    throw new PageValidationError("A post already uses this slug.");
  }

  return slug;
}

export function resolvePublishedAt(status: string, value?: string | null) {
  if (value) return new Date(value);
  return status === "PUBLISHED" ? new Date() : null;
}

export function cleanNullable(value: string | null | undefined) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

export function revalidatePageCaches(...slugs: Array<string | null | undefined>) {
  revalidateTag("navigation-pages", "max");
  revalidatePath("/admin/pages");
  revalidatePath("/server-sitemap.xml");

  slugs.forEach((slug) => {
    if (slug) revalidatePath(getPageUrl(slug));
  });
}

export class PageValidationError extends Error {}

export function handlePageWriteError(error: unknown, fallback: string) {
  if (error instanceof PageValidationError) {
    return NextResponse.json({ error: error.message }, { status: 422 });
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json({ error: error.errors }, { status: 422 });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return NextResponse.json({ error: "A page already exists with this value." }, { status: 409 });
  }

  console.error("[admin pages]", error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}
