import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/** GET /api/plans — public list of active subscription plans */
export async function GET() {
  try {
    const plans = await db.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        priceMonthly: true,
        priceYearly: true,
        downloadQuota: true,
        features: true,
        sortOrder: true,
        paystackPlanCodeMonthly: true,
        paystackPlanCodeYearly: true,
      },
    });
    return NextResponse.json(plans);
  } catch (err) {
    console.error("[GET /api/plans]", err);
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}
