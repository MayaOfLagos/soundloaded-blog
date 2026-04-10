import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { deleteFromR2, MEDIA_BUCKET, MUSIC_BUCKET } from "@/lib/r2";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(50),
});

/**
 * POST /api/admin/media/bulk-delete — Delete multiple media items
 * Body: { ids: string[] }
 */
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { ids } = bulkDeleteSchema.parse(body);

    const items = await db.media.findMany({ where: { id: { in: ids } } });

    // Delete from R2 in parallel
    const r2Deletions = items.map(async (item) => {
      try {
        const bucket = item.type === "AUDIO" ? MUSIC_BUCKET : MEDIA_BUCKET;
        await deleteFromR2(bucket, item.r2Key);
      } catch (err) {
        console.error(`[BULK DELETE R2] ${item.r2Key}:`, err);
      }
    });
    await Promise.allSettled(r2Deletions);

    // Delete from DB
    const result = await db.media.deleteMany({ where: { id: { in: ids } } });

    return NextResponse.json({ deleted: result.count });
  } catch (err) {
    console.error("[POST /api/admin/media/bulk-delete]", err);
    return NextResponse.json({ error: "Bulk delete failed" }, { status: 500 });
  }
}
