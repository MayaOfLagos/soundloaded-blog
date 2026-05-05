import { NextResponse } from "next/server";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { z } from "zod";

/* GET /api/admin/genres — list all genres with track counts */
export async function GET() {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const rows = await db.music.groupBy({
    by: ["genre"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  const genres = rows.map((r) => ({
    name: r.genre ?? null,
    count: r._count.id,
  }));

  return NextResponse.json({ genres });
}

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("rename"),
    from: z.string().min(1),
    to: z.string().min(1).max(80),
  }),
  z.object({
    action: z.literal("merge"),
    sources: z.array(z.string().min(1)).min(2),
    target: z.string().min(1).max(80),
  }),
  z.object({
    action: z.literal("delete"),
    genre: z.string().min(1),
  }),
]);

/* PATCH /api/admin/genres — rename | merge | delete */
export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;

  if (payload.action === "rename") {
    const { count } = await db.music.updateMany({
      where: { genre: payload.from },
      data: { genre: payload.to },
    });
    return NextResponse.json({ updated: count });
  }

  if (payload.action === "merge") {
    const { count } = await db.music.updateMany({
      where: { genre: { in: payload.sources } },
      data: { genre: payload.target },
    });
    return NextResponse.json({ updated: count });
  }

  if (payload.action === "delete") {
    const { count } = await db.music.updateMany({
      where: { genre: payload.genre },
      data: { genre: null },
    });
    return NextResponse.json({ updated: count });
  }
}
