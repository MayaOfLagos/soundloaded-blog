export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Download, MessageSquare, Bookmark, Heart, Music, Crown } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLeftSidebar } from "@/components/dashboard/DashboardLeftSidebar";
import { DashboardActivityChart } from "@/components/dashboard/DashboardActivityChart";
import { DashboardStatsDonut } from "@/components/dashboard/DashboardStatsDonut";
import { ArtistDashboard } from "@/components/dashboard/ArtistDashboard";
import { LabelDashboard } from "@/components/dashboard/LabelDashboard";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Dashboard — Soundloaded",
};

async function getDashboardData(userId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalDownloads,
    recentDownloadCount,
    totalComments,
    totalBookmarks,
    totalFavorites,
    user,
    subscription,
    recentDownloads,
    recentComments,
    downloadActivity,
  ] = await Promise.all([
    db.download.count({ where: { userId } }),
    db.download.count({ where: { userId, createdAt: { gte: thirtyDaysAgo } } }),
    db.comment.count({ where: { authorId: userId } }),
    db.bookmark.count({ where: { userId } }),
    db.favorite.count({ where: { userId } }),
    db.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, image: true, createdAt: true, role: true },
    }),
    db.subscription.findUnique({ where: { userId } }),
    db.download.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        music: {
          select: {
            title: true,
            coverArt: true,
            artist: { select: { name: true } },
          },
        },
      },
    }),
    db.comment.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        post: { select: { title: true, slug: true } },
      },
    }),
    db.download.findMany({
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),
  ]);

  const chartData = Object.entries(
    downloadActivity.reduce(
      (acc, d) => {
        const date = format(d.createdAt, "MMM d");
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    )
  ).map(([date, downloads]) => ({ date, downloads }));

  return {
    totalDownloads,
    recentDownloadCount,
    totalComments,
    totalBookmarks,
    totalFavorites,
    user,
    subscription,
    recentDownloads,
    recentComments,
    chartData,
  };
}

const STATS_CONFIG = [
  {
    key: "totalDownloads" as const,
    label: "Downloads",
    Icon: Download,
    gradient: "from-rose-500 to-rose-600",
  },
  {
    key: "totalComments" as const,
    label: "Comments",
    Icon: MessageSquare,
    gradient: "from-blue-500 to-blue-600",
  },
  {
    key: "totalBookmarks" as const,
    label: "Bookmarks",
    Icon: Bookmark,
    gradient: "from-amber-500 to-amber-600",
  },
  {
    key: "totalFavorites" as const,
    label: "Favorites",
    Icon: Heart,
    gradient: "from-pink-500 to-pink-600",
  },
];

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;

  // Check for creator profiles
  const [artistProfile, labelProfile] = await Promise.all([
    db.artist.findUnique({
      where: { ownerId: userId },
      include: {
        _count: { select: { music: true, albums: true, artistFollows: true } },
      },
    }),
    db.label.findUnique({
      where: { ownerId: userId },
      include: {
        _count: { select: { artists: true } },
      },
    }),
  ]);

  // Route to creator dashboard if applicable
  if (artistProfile) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-6 py-5 xl:grid-cols-[220px_1fr]">
          <DashboardLeftSidebar />
          <ArtistDashboard artist={JSON.parse(JSON.stringify(artistProfile))} userId={userId} />
        </div>
      </div>
    );
  }

  if (labelProfile) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-6 py-5 xl:grid-cols-[220px_1fr]">
          <DashboardLeftSidebar />
          <LabelDashboard label={JSON.parse(JSON.stringify(labelProfile))} userId={userId} />
        </div>
      </div>
    );
  }

  // Default: Reader dashboard
  const data = await getDashboardData(userId);

  if (!data.user) redirect("/login");

  const firstName = data.user.name?.split(" ")[0] || "User";

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
      <div className="grid grid-cols-1 gap-6 py-5 xl:grid-cols-[220px_1fr]">
        <DashboardLeftSidebar />

        <main className="min-w-0 space-y-6">
          {/* ── Page header ── */}
          <div>
            <h1 className="text-foreground text-2xl font-black">Dashboard</h1>
            <p className="text-muted-foreground text-sm">Welcome back, {firstName}</p>
          </div>

          {/* ── Stats grid ── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STATS_CONFIG.map(({ key, label, Icon, gradient }) => (
              <div
                key={key}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white shadow-lg`}
              >
                <p className="text-3xl font-black">{data[key]}</p>
                <p className="mt-1 text-sm font-medium text-white/80">{label}</p>
                <Icon className="absolute -right-2 -bottom-2 h-20 w-20 text-white/15" />
              </div>
            ))}
          </div>

          {/* ── Charts row ── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DashboardActivityChart data={data.chartData} />
            <DashboardStatsDonut
              downloads={data.totalDownloads}
              comments={data.totalComments}
              bookmarks={data.totalBookmarks}
              favorites={data.totalFavorites}
            />
          </div>

          {/* ── Recent Downloads + Recent Comments ── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Recent Downloads */}
            <div className="bg-card/50 ring-border/40 rounded-2xl p-5 ring-1 backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download className="text-brand h-4 w-4" />
                  <h2 className="text-foreground text-sm font-bold">Recent Downloads</h2>
                </div>
                <Link href="/downloads" className="text-brand text-xs font-medium hover:underline">
                  View all
                </Link>
              </div>

              {data.recentDownloads.length === 0 ? (
                <p className="text-muted-foreground py-6 text-center text-sm">No downloads yet</p>
              ) : (
                <div className="space-y-3">
                  {data.recentDownloads.map((download) => (
                    <div key={download.id} className="flex items-center gap-3">
                      {download.music.coverArt ? (
                        <Image
                          src={download.music.coverArt}
                          alt={download.music.title}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                          <Music className="text-muted-foreground h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-foreground truncate text-sm font-medium">
                          {download.music.title}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {download.music.artist?.name || "Unknown Artist"}
                        </p>
                      </div>
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {format(download.createdAt, "MMM d")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Comments */}
            <div className="bg-card/50 ring-border/40 rounded-2xl p-5 ring-1 backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="text-brand h-4 w-4" />
                  <h2 className="text-foreground text-sm font-bold">Recent Comments</h2>
                </div>
                <Link href="/comments" className="text-brand text-xs font-medium hover:underline">
                  View all
                </Link>
              </div>

              {data.recentComments.length === 0 ? (
                <p className="text-muted-foreground py-6 text-center text-sm">No comments yet</p>
              ) : (
                <div className="space-y-3">
                  {data.recentComments.map((comment) => (
                    <div key={comment.id} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          href={`/${comment.post.slug}`}
                          className="text-foreground truncate text-sm font-medium hover:underline"
                        >
                          {comment.post.title}
                        </Link>
                        <Badge
                          variant={
                            comment.status === "APPROVED"
                              ? "default"
                              : comment.status === "PENDING"
                                ? "secondary"
                                : "destructive"
                          }
                          className="shrink-0 text-[10px]"
                        >
                          {comment.status.toLowerCase()}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground line-clamp-1 text-xs">{comment.body}</p>
                      <p className="text-muted-foreground/60 text-[11px]">
                        {format(comment.createdAt, "MMM d, yyyy")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Subscription card ── */}
          {data.subscription && (
            <div className="bg-card/50 ring-border/40 rounded-2xl p-5 ring-1 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="bg-brand/10 flex h-10 w-10 items-center justify-center rounded-xl">
                  <Crown className="text-brand h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground text-sm font-bold capitalize">
                    {data.subscription.plan.toLowerCase()} Plan
                  </p>
                  {data.subscription.currentPeriodEnd && (
                    <p className="text-muted-foreground text-xs">
                      Renews on {format(data.subscription.currentPeriodEnd, "MMMM d, yyyy")}
                    </p>
                  )}
                </div>
                <Badge variant={data.subscription.status === "ACTIVE" ? "default" : "secondary"}>
                  {data.subscription.status.toLowerCase()}
                </Badge>
              </div>
            </div>
          )}

          {/* ── Quick Actions ── */}
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/fanlinks/new"
              className="bg-brand text-brand-foreground hover:bg-brand/90 rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
            >
              + Create Fanlink
            </Link>
            <Link
              href="/dashboard/fanlinks"
              className="bg-muted text-muted-foreground hover:bg-brand/10 hover:text-brand rounded-xl px-4 py-2 text-sm font-medium transition-colors"
            >
              My Fanlinks
            </Link>
            <Link
              href="/music"
              className="bg-muted text-muted-foreground hover:bg-brand/10 hover:text-brand rounded-xl px-4 py-2 text-sm font-medium transition-colors"
            >
              Browse Music
            </Link>
            <Link
              href="/"
              className="bg-muted text-muted-foreground hover:bg-brand/10 hover:text-brand rounded-xl px-4 py-2 text-sm font-medium transition-colors"
            >
              View Blog
            </Link>
            <Link
              href="/settings"
              className="bg-muted text-muted-foreground hover:bg-brand/10 hover:text-brand rounded-xl px-4 py-2 text-sm font-medium transition-colors"
            >
              Settings
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
