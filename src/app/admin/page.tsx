export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { FileText, Music, Download, Users, MessageSquare, Mail, Flag, Camera } from "lucide-react";
import { StatWidget } from "@/components/admin/StatWidget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

function calcTrend(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

async function getDashboardStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    totalPosts,
    postsLastMonth,
    postsPrevMonth,
    totalMusic,
    musicLastMonth,
    musicPrevMonth,
    totalDownloads,
    totalUsers,
    usersLastMonth,
    usersPrevMonth,
    totalComments,
    pendingComments,
    confirmedSubscribers,
    pendingReports,
    activeStories,
    recentPosts,
  ] = await Promise.all([
    // Posts
    db.post.count(),
    db.post.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.post.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
    // Music
    db.music.count(),
    db.music.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.music.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
    // Downloads
    db.download.count(),
    // Users
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.user.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
    // Comments
    db.comment.count(),
    db.comment.count({ where: { status: "PENDING" } }),
    // Subscribers
    db.subscriber.count({ where: { status: "CONFIRMED" } }),
    // Reports
    db.report.count({ where: { status: "PENDING" } }),
    // Stories (last 24h)
    db.story.count({ where: { createdAt: { gte: twentyFourHoursAgo } } }),
    // Recent activity
    db.post.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        type: true,
        createdAt: true,
        author: { select: { name: true } },
      },
    }),
  ]);

  return {
    totalPosts,
    postsTrend: calcTrend(postsLastMonth, postsPrevMonth),
    totalMusic,
    musicTrend: calcTrend(musicLastMonth, musicPrevMonth),
    totalDownloads,
    totalUsers,
    usersTrend: calcTrend(usersLastMonth, usersPrevMonth),
    totalComments,
    pendingComments,
    confirmedSubscribers,
    pendingReports,
    activeStories,
    recentPosts,
  };
}

const statusColors: Record<string, string> = {
  PUBLISHED: "bg-success/10 text-success border-success/20",
  DRAFT: "bg-muted text-muted-foreground border-border",
  SCHEDULED: "bg-primary/10 text-primary border-primary/20",
  ARCHIVED: "bg-destructive/10 text-destructive border-destructive/20",
};

const typeLabels: Record<string, string> = {
  NEWS: "News",
  MUSIC: "Music",
  GIST: "Gist",
  ALBUM: "Album",
  VIDEO: "Video",
  LYRICS: "Lyrics",
  COMMUNITY: "Community",
};

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      {/* Stat widgets — 4 cols desktop, 2 cols tablet, 1 col mobile */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatWidget
          title="Total Posts"
          value={stats.totalPosts}
          icon={FileText}
          trend={stats.postsTrend}
          href="/admin/posts"
          iconClassName="bg-primary/10 text-primary dark:bg-primary/20"
        />
        <StatWidget
          title="Music Tracks"
          value={stats.totalMusic}
          icon={Music}
          trend={stats.musicTrend}
          href="/admin/music"
          iconClassName="bg-success/10 text-success dark:bg-success/20"
        />
        <StatWidget
          title="Downloads"
          value={stats.totalDownloads}
          icon={Download}
          subtitle="Total all-time"
          href="/admin/music"
          iconClassName="bg-brand/10 text-brand dark:bg-brand/20"
        />
        <StatWidget
          title="Users"
          value={stats.totalUsers}
          icon={Users}
          trend={stats.usersTrend}
          href="/admin/users"
          iconClassName="bg-blue-500/10 text-blue-500 dark:bg-blue-500/20"
        />
        <StatWidget
          title="Comments"
          value={stats.totalComments}
          icon={MessageSquare}
          subtitle={stats.pendingComments > 0 ? `${stats.pendingComments} pending` : "All clear"}
          href="/admin/comments"
          iconClassName="bg-amber-500/10 text-amber-500 dark:bg-amber-500/20"
        />
        <StatWidget
          title="Subscribers"
          value={stats.confirmedSubscribers}
          icon={Mail}
          subtitle="Confirmed"
          href="/admin/newsletter"
          iconClassName="bg-violet-500/10 text-violet-500 dark:bg-violet-500/20"
        />
        <StatWidget
          title="Pending Reports"
          value={stats.pendingReports}
          icon={Flag}
          subtitle="Needs review"
          href="/admin/reports"
          iconClassName="bg-destructive/10 text-destructive dark:bg-destructive/20"
        />
        <StatWidget
          title="Active Stories"
          value={stats.activeStories}
          icon={Camera}
          subtitle="Last 24 hours"
          href="/admin/stories"
          iconClassName="bg-pink-500/10 text-pink-500 dark:bg-pink-500/20"
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <Link href="/admin/posts" className="text-primary text-sm font-medium hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {stats.recentPosts.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No posts yet. Create your first post!
            </p>
          ) : (
            <div className="space-y-3">
              {stats.recentPosts.map((post) => (
                <div
                  key={post.id}
                  className="border-border bg-muted/30 flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="hover:text-primary line-clamp-1 text-sm font-medium transition-colors"
                    >
                      {post.title}
                    </Link>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {post.author?.name || "Unknown"} &middot;{" "}
                      {post.createdAt.toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                      {typeLabels[post.type] || post.type}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`px-1.5 py-0 text-[10px] ${statusColors[post.status] || ""}`}
                    >
                      {post.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
