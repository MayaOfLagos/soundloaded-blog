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

const patchSchema = z.object({
  role: z.enum(["READER", "CONTRIBUTOR", "EDITOR", "ADMIN", "SUPER_ADMIN"]),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await params;
  try {
    const body = await req.json();
    const { role } = patchSchema.parse(body);
    const user = await db.user.update({ where: { id: userId }, data: { role } });
    return NextResponse.json({ id: user.id, role: user.role });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 422 });
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
