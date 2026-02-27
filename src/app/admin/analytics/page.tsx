import type { Metadata } from "next";
import { Eye, Download, TrendingUp, FileText, Music } from "lucide-react";
import { db } from "@/lib/db";
import { AnalyticsCharts } from "@/components/admin/AnalyticsCharts";

export const metadata: Metadata = { title: "Analytics — Soundloaded Admin" };

async function getAnalyticsData() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalViews, totalDownloads, downloadsToday, topPosts, topMusic, recentPostsForChart] =
      await Promise.all([
        db.post.aggregate({ _sum: { views: true } }),
        db.download.count(),
        db.download.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        db.post.findMany({
          where: { status: "PUBLISHED" },
          orderBy: { views: "desc" },
          take: 5,
          select: { id: true, title: true, slug: true, views: true, publishedAt: true, type: true },
        }),
        db.music.findMany({
          orderBy: { downloadCount: "desc" },
          take: 5,
          select: {
            id: true,
            title: true,
            slug: true,
            downloadCount: true,
            artist: { select: { name: true } },
          },
        }),
        db.post.findMany({
          where: {
            status: "PUBLISHED",
            publishedAt: { gte: thirtyDaysAgo },
          },
          orderBy: { publishedAt: "asc" },
          select: { publishedAt: true, views: true },
        }),
      ]);

    // Build 30-day views chart data (aggregate by date)
    const viewsByDay: Record<string, number> = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      viewsByDay[key] = 0;
    }

    recentPostsForChart.forEach((p) => {
      if (p.publishedAt) {
        const key = new Date(p.publishedAt).toISOString().slice(0, 10);
        if (key in viewsByDay) {
          viewsByDay[key] = (viewsByDay[key] ?? 0) + p.views;
        }
      }
    });

    const viewsChartData = Object.entries(viewsByDay).map(([date, views]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      views,
    }));

    const downloadsChartData = topMusic.map((m) => ({
      name: m.title.length > 20 ? m.title.slice(0, 20) + "…" : m.title,
      artist: m.artist.name,
      downloads: m.downloadCount,
    }));

    return {
      totalViews: totalViews._sum.views ?? 0,
      totalDownloads,
      downloadsToday,
      topPosts,
      topMusic,
      viewsChartData,
      downloadsChartData,
    };
  } catch {
    return {
      totalViews: 0,
      totalDownloads: 0,
      downloadsToday: 0,
      topPosts: [],
      topMusic: [],
      viewsChartData: [],
      downloadsChartData: [],
    };
  }
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  const statsCards = [
    {
      title: "Total Page Views",
      value: data.totalViews.toLocaleString(),
      icon: Eye,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Total Downloads",
      value: data.totalDownloads.toLocaleString(),
      icon: Download,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Downloads Today",
      value: data.downloadsToday.toLocaleString(),
      icon: TrendingUp,
      color: "text-brand",
      bg: "bg-brand/10",
    },
    {
      title: "Top Post Views",
      value: data.topPosts[0]?.views.toLocaleString() ?? "0",
      icon: FileText,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-foreground text-2xl font-black">Analytics</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Platform performance overview — last 30 days
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statsCards.map((card) => (
          <div key={card.title} className="border-border bg-card rounded-xl border p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-sm">{card.title}</p>
                <p className="text-foreground mt-1 text-2xl font-black">{card.value}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts (client component) */}
      <AnalyticsCharts viewsData={data.viewsChartData} downloadsData={data.downloadsChartData} />

      {/* Top Posts table */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="border-border bg-card overflow-hidden rounded-xl border">
          <div className="border-border flex items-center gap-2 border-b px-5 py-4">
            <FileText className="text-muted-foreground h-4 w-4" />
            <h3 className="text-foreground text-sm font-bold">Top Posts by Views</h3>
          </div>
          {data.topPosts.length === 0 ? (
            <div className="text-muted-foreground p-8 text-center text-sm">No data yet</div>
          ) : (
            <div className="divide-border divide-y">
              {data.topPosts.map((post, idx) => (
                <div key={post.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-muted-foreground/40 w-6 flex-shrink-0 text-lg font-black">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <a
                      href={`/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:text-brand line-clamp-1 text-sm font-semibold transition-colors"
                    >
                      {post.title}
                    </a>
                    <p className="text-muted-foreground text-xs capitalize">
                      {post.type.toLowerCase()}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1">
                    <Eye className="text-muted-foreground h-3 w-3" />
                    <span className="text-foreground text-sm font-bold">
                      {post.views.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Music */}
        <div className="border-border bg-card overflow-hidden rounded-xl border">
          <div className="border-border flex items-center gap-2 border-b px-5 py-4">
            <Music className="text-muted-foreground h-4 w-4" />
            <h3 className="text-foreground text-sm font-bold">Top Music by Downloads</h3>
          </div>
          {data.topMusic.length === 0 ? (
            <div className="text-muted-foreground p-8 text-center text-sm">No data yet</div>
          ) : (
            <div className="divide-border divide-y">
              {data.topMusic.map((track, idx) => (
                <div key={track.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-muted-foreground/40 w-6 flex-shrink-0 text-lg font-black">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <a
                      href={`/music/${track.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:text-brand line-clamp-1 text-sm font-semibold transition-colors"
                    >
                      {track.title}
                    </a>
                    <p className="text-muted-foreground text-xs">{track.artist.name}</p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1">
                    <Download className="text-muted-foreground h-3 w-3" />
                    <span className="text-foreground text-sm font-bold">
                      {track.downloadCount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
