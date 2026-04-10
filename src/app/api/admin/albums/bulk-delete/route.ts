import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(50),
});

/**
 * POST /api/admin/albums/bulk-delete — Delete multiple albums
 * Skips albums that still have associated tracks.
 * Body: { ids: string[] }
 */
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { ids } = bulkDeleteSchema.parse(body);

    // Find albums that have NO associated tracks (safe to delete)
    const albums = await db.album.findMany({
      where: { id: { in: ids } },
      select: { id: true, _count: { select: { tracks: true } } },
    });

    const deletable = albums.filter((a) => a._count.tracks === 0).map((a) => a.id);
    const skipped = albums.filter((a) => a._count.tracks > 0).length;

    let deleted = 0;
    if (deletable.length > 0) {
      const result = await db.album.deleteMany({ where: { id: { in: deletable } } });
      deleted = result.count;
    }

    return NextResponse.json({ deleted, skipped });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 422 });
    }
    console.error("[POST /api/admin/albums/bulk-delete]", err);
    return NextResponse.json({ error: "Bulk delete failed" }, { status: 500 });
  }
}
