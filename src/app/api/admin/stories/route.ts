import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "EDITOR"];

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role ?? "";
  if (!session || !ADMIN_ROLES.includes(role)) return null;
  return session;
}

/** GET — admin stories dashboard data */
export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") || "1"));
  const limit = Math.min(
    50,
    Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") || "20"))
  );

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Stats
  const [totalStories24h, activeStories, totalViews, totalStoriesAll] = await Promise.all([
    db.story.count({ where: { createdAt: { gte: twentyFourHoursAgo } } }),
    db.story.count({ where: { expiresAt: { gt: now } } }),
    db.storyView.count(),
    db.story.count(),
  ]);

  const avgViewsPerStory = totalStoriesAll > 0 ? Math.round(totalViews / totalStoriesAll) : 0;

  // 30-day chart data
  const chartStories = await db.story.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true },
  });

  const chartMap = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    chartMap.set(date.toISOString().split("T")[0], 0);
  }
  for (const story of chartStories) {
    const dateStr = story.createdAt.toISOString().split("T")[0];
    chartMap.set(dateStr, (chartMap.get(dateStr) ?? 0) + 1);
  }
  const chartData = Array.from(chartMap.entries()).map(([date, count]) => ({ date, count }));

  // Paginated stories list
  const [stories, total] = await Promise.all([
    db.story.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true, image: true } },
        items: {
          select: { type: true, _count: { select: { views: true } } },
          orderBy: { order: "asc" },
        },
      },
    }),
    db.story.count(),
  ]);

  const storiesList = stories.map((story) => {
    const viewCount = story.items.reduce((sum, item) => sum + item._count.views, 0);
    return {
      id: story.id,
      author: story.author,
      type: story.items[0]?.type ?? "IMAGE",
      itemCount: story.items.length,
      viewCount,
      createdAt: story.createdAt.toISOString(),
      expiresAt: story.expiresAt.toISOString(),
      status: story.expiresAt > now ? "active" : "expired",
    };
  });

  return NextResponse.json({
    stats: { totalStories24h, activeStories, totalViews, avgViewsPerStory },
    chartData,
    stories: storiesList,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
