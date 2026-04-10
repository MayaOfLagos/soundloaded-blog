import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { removeFromIndex, INDEXES } from "@/lib/meilisearch";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";

const schema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
});

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { ids } = schema.parse(body);

    // Check which posts are already archived (permanently delete those)
    const archivedPosts = await db.post.findMany({
      where: { id: { in: ids }, status: "ARCHIVED" },
      select: { id: true },
    });
    const archivedIds = new Set(archivedPosts.map((p) => p.id));
    const toArchive = ids.filter((id) => !archivedIds.has(id));
    const toDelete = ids.filter((id) => archivedIds.has(id));

    let archivedCount = 0;
    let deletedCount = 0;

    // Archive non-archived posts
    if (toArchive.length > 0) {
      const result = await db.post.updateMany({
        where: { id: { in: toArchive } },
        data: { status: "ARCHIVED" },
      });
      archivedCount = result.count;
    }

    // Permanently delete already-archived posts
    if (toDelete.length > 0) {
      const result = await db.post.deleteMany({
        where: { id: { in: toDelete } },
      });
      deletedCount = result.count;
    }

    // Remove from search index
    for (const id of ids) {
      removeFromIndex(INDEXES.POSTS, id);
    }

    return NextResponse.json({ archived: archivedCount, deleted: deletedCount });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 422 });
    }
    console.error("[POST /api/admin/posts/bulk-delete]", err);
    return NextResponse.json({ error: "Failed to archive posts" }, { status: 500 });
  }
}
