import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteFromR2, MEDIA_BUCKET, MUSIC_BUCKET } from "@/lib/r2";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

/**
 * POST /api/admin/media/bulk-delete — Delete multiple media items
 * Body: { ids: string[] }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role ?? "";
  if (!session || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids array required" }, { status: 400 });
    }

    if (ids.length > 50) {
      return NextResponse.json({ error: "Maximum 50 items per batch" }, { status: 400 });
    }

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
