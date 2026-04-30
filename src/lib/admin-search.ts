import { db } from "@/lib/db";

export interface SearchDemandItem {
  query: string;
  count: number;
  results?: number;
  growth?: number;
}

export interface SearchDemandSnapshot {
  windowDays: number;
  totalSearches: number;
  topQueries: SearchDemandItem[];
  zeroResultQueries: SearchDemandItem[];
  fastestRisingQueries: SearchDemandItem[];
  recentQueries: Array<{
    id: string;
    query: string;
    results: number;
    engine: string;
    createdAt: string;
  }>;
}

export async function getSearchDemandSnapshot(): Promise<SearchDemandSnapshot> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [totalSearches, topQueries, zeroResultQueries, recentQueries, currentWeek, previousWeek] =
    await Promise.all([
      db.searchQuery.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      db.searchQuery.groupBy({
        by: ["query"],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: { query: true },
        _sum: { results: true },
        orderBy: { _count: { query: "desc" } },
        take: 10,
      }),
      db.searchQuery.groupBy({
        by: ["query"],
        where: { createdAt: { gte: thirtyDaysAgo }, results: 0 },
        _count: { query: true },
        orderBy: { _count: { query: "desc" } },
        take: 10,
      }),
      db.searchQuery.findMany({
        orderBy: { createdAt: "desc" },
        take: 12,
        select: { id: true, query: true, results: true, engine: true, createdAt: true },
      }),
      db.searchQuery.groupBy({
        by: ["query"],
        where: { createdAt: { gte: sevenDaysAgo } },
        _count: { query: true },
      }),
      db.searchQuery.groupBy({
        by: ["query"],
        where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
        _count: { query: true },
      }),
    ]);

  const previousCounts = new Map(previousWeek.map((item) => [item.query, item._count.query]));
  const fastestRisingQueries = currentWeek
    .map((item) => {
      const previous = previousCounts.get(item.query) ?? 0;
      return {
        query: item.query,
        count: item._count.query,
        growth: item._count.query - previous,
      };
    })
    .filter((item) => item.growth > 0)
    .sort((a, b) => b.growth - a.growth || b.count - a.count)
    .slice(0, 10);

  return {
    windowDays: 30,
    totalSearches,
    topQueries: topQueries.map((item) => ({
      query: item.query,
      count: item._count.query,
      results: item._sum.results ?? 0,
    })),
    zeroResultQueries: zeroResultQueries.map((item) => ({
      query: item.query,
      count: item._count.query,
    })),
    fastestRisingQueries,
    recentQueries: recentQueries.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
  };
}
