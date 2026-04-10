import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";

const bulkActionSchema = z.object({
  action: z.enum(["archive", "delete"]),
  ids: z.array(z.string()).min(1).max(100),
});

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const body = await req.json();
  const parsed = bulkActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { action, ids } = parsed.data;

  // Only allow actions on COMMUNITY posts
  const communityFilter = {
    id: { in: ids },
    type: "COMMUNITY" as const,
    isUserGenerated: true,
  };

  if (action === "archive") {
    const result = await db.post.updateMany({
      where: communityFilter,
      data: { status: "ARCHIVED" },
    });
    return NextResponse.json({ archived: result.count });
  }

  if (action === "delete") {
    const result = await db.post.deleteMany({
      where: communityFilter,
    });
    return NextResponse.json({ deleted: result.count });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
