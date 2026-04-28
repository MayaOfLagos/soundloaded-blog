import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";

/** GET /api/admin/plans — list all subscription plans */
export async function GET() {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    const plans = await db.plan.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(plans);
  } catch (err) {
    console.error("[GET /api/admin/plans]", err);
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}
