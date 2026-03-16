import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { removeFromIndex, INDEXES } from "@/lib/meilisearch";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "EDITOR"];

const schema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role ?? "";
  if (!session || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { ids } = schema.parse(body);

    // Archive instead of hard delete to preserve data integrity
    const result = await db.post.updateMany({
      where: { id: { in: ids } },
      data: { status: "ARCHIVED" },
    });

    // Remove from search index
    for (const id of ids) {
      removeFromIndex(INDEXES.POSTS, id);
    }

    return NextResponse.json({ archived: result.count });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 422 });
    }
    console.error("[POST /api/admin/posts/bulk-delete]", err);
    return NextResponse.json({ error: "Failed to archive posts" }, { status: 500 });
  }
}
