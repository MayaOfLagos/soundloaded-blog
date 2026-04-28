import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import type { PostStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";
import { DEFAULT_PAGE_BODY } from "@/lib/pages";
import {
  cleanNullable,
  handlePageWriteError,
  pageSchema,
  revalidatePageCaches,
  resolvePublishedAt,
  validatePageSlug,
} from "@/lib/admin-pages";

const PAGE_STATUSES = new Set<string>(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]);

export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("limit") ?? "20", 10)));
  const status = searchParams.get("status");
  const query = searchParams.get("q")?.trim();
  const statusFilter = status && PAGE_STATUSES.has(status) ? (status as PostStatus) : null;

  const where: Prisma.PageWhereInput = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } },
            { excerpt: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [pages, total] = await Promise.all([
    db.page.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        template: true,
        publishedAt: true,
        updatedAt: true,
        views: true,
        showInHeader: true,
        showInFooter: true,
        isSystem: true,
        author: { select: { name: true, email: true } },
      },
    }),
    db.page.count({ where }),
  ]);

  return NextResponse.json({ pages, total, page, limit });
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    const body = await request.json();
    const data = pageSchema.parse(body);
    const userId = (session.user as { id?: string }).id;
    const slug = await validatePageSlug(data.slug);

    const page = await db.page.create({
      data: {
        title: data.title.trim(),
        slug,
        excerpt: cleanNullable(data.excerpt),
        body: data.body ?? DEFAULT_PAGE_BODY,
        coverImage: data.coverImage || null,
        status: data.status,
        template: data.template,
        publishedAt: resolvePublishedAt(data.status, data.publishedAt),
        authorId: data.authorId || userId || null,
        showInHeader: data.showInHeader,
        showInFooter: data.showInFooter,
        sortOrder: data.sortOrder,
        metaTitle: cleanNullable(data.metaTitle),
        metaDescription: cleanNullable(data.metaDescription),
        focusKeyword: cleanNullable(data.focusKeyword),
      },
    });

    revalidatePageCaches(page.slug);
    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    return handlePageWriteError(error, "Failed to create page");
  }
}
