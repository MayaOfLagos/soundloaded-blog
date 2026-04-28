import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";
import { SYSTEM_PAGE_SEEDS } from "@/lib/pages";
import { revalidatePageCaches } from "@/lib/admin-pages";

export async function POST() {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const userId = (session.user as { id?: string }).id ?? null;
  const result = {
    created: 0,
    skipped: 0,
    pages: [] as Array<{ id: string; title: string; slug: string; created: boolean }>,
  };

  for (const seed of SYSTEM_PAGE_SEEDS) {
    const existing = await db.page.findFirst({
      where: { OR: [{ systemKey: seed.systemKey }, { slug: seed.slug }] },
      select: { id: true, title: true, slug: true },
    });

    if (existing) {
      result.skipped += 1;
      result.pages.push({ ...existing, created: false });
      continue;
    }

    const page = await db.page.create({
      data: {
        title: seed.title,
        slug: seed.slug,
        excerpt: seed.excerpt,
        body: seed.body,
        status: "DRAFT",
        template: seed.template,
        authorId: userId,
        showInFooter: seed.showInFooter,
        sortOrder: seed.sortOrder,
        isSystem: true,
        systemKey: seed.systemKey,
      },
      select: { id: true, title: true, slug: true },
    });

    result.created += 1;
    result.pages.push({ ...page, created: true });
  }

  if (result.created > 0) {
    revalidatePageCaches(...result.pages.map((page) => page.slug));
  }

  return NextResponse.json(result);
}
