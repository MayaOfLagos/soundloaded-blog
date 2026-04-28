import { NextRequest, NextResponse } from "next/server";
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

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  const page = await db.page.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
  });

  if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });
  return NextResponse.json(page);
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { id } = await params;

  try {
    const existingPage = await db.page.findUnique({
      where: { id },
      select: { id: true, slug: true },
    });
    if (!existingPage) return NextResponse.json({ error: "Page not found" }, { status: 404 });

    const body = await request.json();
    const data = pageSchema.partial().parse(body);
    const slug = data.slug ? await validatePageSlug(data.slug, id) : undefined;

    const page = await db.page.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title.trim() } : {}),
        ...(slug !== undefined ? { slug } : {}),
        ...(data.excerpt !== undefined ? { excerpt: cleanNullable(data.excerpt) } : {}),
        ...(data.body !== undefined ? { body: data.body ?? DEFAULT_PAGE_BODY } : {}),
        ...(data.coverImage !== undefined ? { coverImage: data.coverImage || null } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.template !== undefined ? { template: data.template } : {}),
        ...(data.publishedAt !== undefined || data.status !== undefined
          ? { publishedAt: resolvePublishedAt(data.status ?? "", data.publishedAt) }
          : {}),
        ...(data.authorId !== undefined ? { authorId: data.authorId || null } : {}),
        ...(data.showInHeader !== undefined ? { showInHeader: data.showInHeader } : {}),
        ...(data.showInFooter !== undefined ? { showInFooter: data.showInFooter } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
        ...(data.metaTitle !== undefined ? { metaTitle: cleanNullable(data.metaTitle) } : {}),
        ...(data.metaDescription !== undefined
          ? { metaDescription: cleanNullable(data.metaDescription) }
          : {}),
        ...(data.focusKeyword !== undefined
          ? { focusKeyword: cleanNullable(data.focusKeyword) }
          : {}),
      },
    });

    revalidatePageCaches(existingPage.slug, page.slug);
    return NextResponse.json(page);
  } catch (error) {
    return handlePageWriteError(error, "Failed to update page");
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  const existingPage = await db.page.findUnique({
    where: { id },
    select: { status: true, isSystem: true, slug: true },
  });

  if (!existingPage) return NextResponse.json({ error: "Page not found" }, { status: 404 });

  if (existingPage.isSystem) {
    const page = await db.page.update({
      where: { id },
      data: { status: "ARCHIVED", showInHeader: false, showInFooter: false },
    });
    revalidatePageCaches(existingPage.slug);
    return NextResponse.json(page);
  }

  if (existingPage.status === "ARCHIVED") {
    await db.page.delete({ where: { id } });
    revalidatePageCaches(existingPage.slug);
    return NextResponse.json({ deleted: true });
  }

  const page = await db.page.update({
    where: { id },
    data: { status: "ARCHIVED", showInHeader: false, showInFooter: false },
  });

  revalidatePageCaches(existingPage.slug);
  return NextResponse.json(page);
}
