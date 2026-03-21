import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role ?? "";
  if (!session || !ADMIN_ROLES.includes(role)) return null;
  return session;
}

const schema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = schema.parse(body);

    // Auto-assign sortOrder to place new category at the end
    const maxOrder = await db.category.aggregate({ _max: { sortOrder: true } });
    const nextOrder = (maxOrder._max.sortOrder ?? -1) + 1;

    const category = await db.category.create({
      data: { ...data, sortOrder: nextOrder },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 422 });
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
