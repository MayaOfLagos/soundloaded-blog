import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "30");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [topQueries, totalSearches, zeroResultQueries, recentQueries] = await Promise.all([
    // Most popular search terms
    db.searchQuery.groupBy({
      by: ["query"],
      _count: { query: true },
      _avg: { results: true },
      where: { createdAt: { gte: since } },
      orderBy: { _count: { query: "desc" } },
      take: limit,
    }),

    // Total search count
    db.searchQuery.count({
      where: { createdAt: { gte: since } },
    }),

    // Queries that returned zero results
    db.searchQuery.groupBy({
      by: ["query"],
      _count: { query: true },
      where: { createdAt: { gte: since }, results: 0 },
      orderBy: { _count: { query: "desc" } },
      take: 20,
    }),

    // Recent searches
    db.searchQuery.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { query: true, results: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({
    topQueries: topQueries.map((q) => ({
      query: q.query,
      count: q._count.query,
      avgResults: Math.round(q._avg.results ?? 0),
    })),
    zeroResultQueries: zeroResultQueries.map((q) => ({
      query: q.query,
      count: q._count.query,
    })),
    totalSearches,
    recentQueries,
    period: { days, since: since.toISOString() },
  });
}
