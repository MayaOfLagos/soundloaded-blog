import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";
import { revalidatePageCaches } from "@/lib/admin-pages";

const schema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
});

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    const { ids } = schema.parse(await request.json());

    const pages = await db.page.findMany({
      where: { id: { in: ids } },
      select: { id: true, slug: true, status: true, isSystem: true },
    });

    const idsToArchive = pages
      .filter((page) => page.status !== "ARCHIVED" || page.isSystem)
      .map((page) => page.id);
    const idsToDelete = pages
      .filter((page) => page.status === "ARCHIVED" && !page.isSystem)
      .map((page) => page.id);

    const [archived, deleted] = await db.$transaction([
      db.page.updateMany({
        where: { id: { in: idsToArchive } },
        data: { status: "ARCHIVED", showInHeader: false, showInFooter: false },
      }),
      db.page.deleteMany({
        where: { id: { in: idsToDelete } },
      }),
    ]);

    revalidatePageCaches(...pages.map((page) => page.slug));

    return NextResponse.json({
      archived: archived.count,
      deleted: deleted.count,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 422 });
    }

    console.error("[POST /api/admin/pages/bulk-delete]", error);
    return NextResponse.json({ error: "Failed to process pages" }, { status: 500 });
  }
}
