import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const results = await db.searchQuery.groupBy({
      by: ["query"],
      where: {
        createdAt: { gte: thirtyDaysAgo },
        results: { gt: 0 },
      },
      _count: { query: true },
      orderBy: { _count: { query: "desc" } },
      take: 10,
    });

    const trending = results.map((r) => r.query);

    return NextResponse.json({ trending });
  } catch {
    return NextResponse.json({ trending: [] });
  }
}
