import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(50),
});

/**
 * POST /api/admin/labels/bulk-delete — Delete multiple labels
 * Skips labels that still have associated artists (409 on individual route).
 * Body: { ids: string[] }
 */
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { ids } = bulkDeleteSchema.parse(body);

    // Find labels that have NO associated artists (safe to delete)
    const labels = await db.label.findMany({
      where: { id: { in: ids } },
      select: { id: true, _count: { select: { artists: true } } },
    });

    const deletable = labels.filter((l) => l._count.artists === 0).map((l) => l.id);
    const skipped = labels.filter((l) => l._count.artists > 0).length;

    let deleted = 0;
    if (deletable.length > 0) {
      const result = await db.label.deleteMany({ where: { id: { in: deletable } } });
      deleted = result.count;
    }

    return NextResponse.json({ deleted, skipped });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 422 });
    }
    console.error("[POST /api/admin/labels/bulk-delete]", err);
    return NextResponse.json({ error: "Bulk delete failed" }, { status: 500 });
  }
}
