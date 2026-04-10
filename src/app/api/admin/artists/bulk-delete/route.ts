import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { removeFromIndex, INDEXES } from "@/lib/meilisearch";
import { z } from "zod";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(50),
});

/**
 * POST /api/admin/artists/bulk-delete — Delete multiple artists
 * Skips artists that still have associated music or albums.
 * Body: { ids: string[] }
 */
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { ids } = bulkDeleteSchema.parse(body);

    // Find artists that have NO associated music or albums (safe to delete)
    const artists = await db.artist.findMany({
      where: { id: { in: ids } },
      select: { id: true, _count: { select: { music: true, albums: true } } },
    });

    const deletable = artists
      .filter((a) => a._count.music === 0 && a._count.albums === 0)
      .map((a) => a.id);
    const skipped = artists.filter((a) => a._count.music > 0 || a._count.albums > 0).length;

    let deleted = 0;
    if (deletable.length > 0) {
      const result = await db.artist.deleteMany({ where: { id: { in: deletable } } });
      deleted = result.count;

      // Remove from Meilisearch
      deletable.forEach((id) => removeFromIndex(INDEXES.ARTISTS, id));
    }

    return NextResponse.json({ deleted, skipped });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 422 });
    }
    console.error("[POST /api/admin/artists/bulk-delete]", err);
    return NextResponse.json({ error: "Bulk delete failed" }, { status: 500 });
  }
}
