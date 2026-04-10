import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { removeFromIndex, INDEXES } from "@/lib/meilisearch";
import { z } from "zod";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";

const bulkSchema = z.object({
  ids: z.array(z.string()).min(1).max(100),
});

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { ids } = bulkSchema.parse(body);

    // Get postIds before deleting music records
    const tracks = await db.music.findMany({
      where: { id: { in: ids } },
      select: { id: true, postId: true },
    });

    const postIds = tracks.map((t) => t.postId);

    // Delete music records
    await db.music.deleteMany({ where: { id: { in: ids } } });

    // Archive companion posts
    if (postIds.length > 0) {
      await db.post.updateMany({
        where: { id: { in: postIds } },
        data: { status: "ARCHIVED" },
      });
    }

    // Remove from Meilisearch
    ids.forEach((id) => removeFromIndex(INDEXES.MUSIC, id));

    return NextResponse.json({ deleted: tracks.length });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 422 });
    console.error("[POST /api/admin/music/bulk-delete]", err);
    return NextResponse.json({ error: "Failed to delete tracks" }, { status: 500 });
  }
}
