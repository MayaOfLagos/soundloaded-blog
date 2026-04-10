import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import {
  requireAdmin,
  isSuperAdmin,
  forbiddenResponse,
  unauthorizedResponse,
} from "@/lib/admin-auth";

const patchSchema = z.object({
  role: z.enum(["READER", "CONTRIBUTOR", "EDITOR", "ADMIN", "SUPER_ADMIN"]),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { userId } = await params;
  try {
    const body = await req.json();
    const { role } = patchSchema.parse(body);

    const currentUserRole = (session.user as { role?: string }).role ?? "";

    // Only SUPER_ADMIN can grant SUPER_ADMIN or ADMIN roles
    if ((role === "SUPER_ADMIN" || role === "ADMIN") && !isSuperAdmin(currentUserRole)) {
      return forbiddenResponse("Only SUPER_ADMIN can assign ADMIN or SUPER_ADMIN roles");
    }

    // Prevent self-demotion of SUPER_ADMIN (safety check)
    const currentUserId = (session.user as { id?: string }).id;
    if (userId === currentUserId && isSuperAdmin(currentUserRole) && role !== "SUPER_ADMIN") {
      return forbiddenResponse("Cannot demote your own SUPER_ADMIN role");
    }

    const user = await db.user.update({ where: { id: userId }, data: { role } });
    return NextResponse.json({ id: user.id, role: user.role });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 422 });
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
