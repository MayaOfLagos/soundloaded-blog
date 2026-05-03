export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Flag,
  ImageIcon,
  Mail,
  MessageSquare,
  Mic2,
  Music,
  Search,
  Sparkles,
  UserCheck,
  Users,
  Wrench,
  Link2,
} from "lucide-react";
import { StatWidget } from "@/components/admin/StatWidget";
import { getAdminOpsSnapshot, type OpsSeverity } from "@/lib/admin-ops";
import { getSessionRole } from "@/lib/admin-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    totalFanlinks,
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
    // Fanlinks
    db.fanlink.count({ where: { status: "PUBLISHED" } }),
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
    totalFanlinks,
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

const opsSeverityStyles: Record<OpsSeverity, string> = {
  critical: "border-destructive/30 bg-destructive/5 text-destructive",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  info: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300",
  ok: "border-success/30 bg-success/10 text-success",
};

const opsIcons = {
  "failed-audio-jobs": Wrench,
  "creator-applications": UserCheck,
  reports: Flag,
  comments: MessageSquare,
  "scheduled-content": Clock,
  "premium-config": Sparkles,
  "missing-artwork": ImageIcon,
  "artist-profiles": Mic2,
  "search-health": Search,
  "pwa-health": CheckCircle2,
};

export default async function AdminDashboardPage() {
  const [stats, sessionRole] = await Promise.all([getDashboardStats(), getSessionRole()]);
  const ops = await getAdminOpsSnapshot(sessionRole?.role ?? "");
  const activeOpsCards = ops.cards.filter((card) => card.severity !== "ok");
  const displayedOpsCards =
    activeOpsCards.length > 0 ? activeOpsCards : ops.cards.filter((card) => card.severity === "ok");
  const quickActions = [
    { label: "Create post", href: "/admin/posts/new" },
    { label: "Upload music", href: "/admin/music/upload" },
    { label: "Review reports", href: "/admin/reports" },
    { label: "Search ops", href: "/admin/search" },
    { label: "PWA settings", href: "/admin/settings" },
  ];

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
        <StatWidget
          title="Fanlinks"
          value={stats.totalFanlinks}
          icon={Link2}
          subtitle="Published"
          href="/admin/fanlinks"
          iconClassName="bg-cyan-500/10 text-cyan-500 dark:bg-cyan-500/20"
        />
      </div>

      {/* Operations Command Center */}
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Operations Command Center</CardTitle>
            <CardDescription>
              Work that needs admin attention before it reaches users.
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={
              activeOpsCards.length > 0
                ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                : "border-success/30 bg-success/10 text-success"
            }
          >
            {activeOpsCards.length > 0
              ? `${activeOpsCards.length} active issue${activeOpsCards.length === 1 ? "" : "s"}`
              : "All clear"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {displayedOpsCards.slice(0, 9).map((card) => {
              const Icon = opsIcons[card.key as keyof typeof opsIcons] ?? AlertTriangle;

              return (
                <Link
                  key={card.key}
                  href={card.href}
                  className="border-border bg-muted/20 hover:bg-muted/40 group flex min-h-[124px] flex-col justify-between rounded-lg border p-4 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${opsSeverityStyles[card.severity]}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className={opsSeverityStyles[card.severity]}>
                      {card.severity}
                    </Badge>
                  </div>
                  <div>
                    <div className="mt-3 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-foreground text-sm font-semibold">{card.title}</p>
                        <p className="text-foreground mt-1 text-2xl font-black">{card.value}</p>
                      </div>
                      <ArrowRight className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-colors" />
                    </div>
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                      {card.subtitle}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="border-border grid gap-4 border-t pt-5 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="text-foreground mb-3 text-sm font-bold">Quick actions</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="border-border hover:bg-muted rounded-md border px-3 py-2 text-sm font-medium transition-colors"
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-foreground mb-3 text-sm font-bold">Recent admin queue</p>
              <div className="space-y-2">
                {ops.recentFailedAudioJobs.length === 0 &&
                ops.recentPendingApplications.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No failed jobs or creator requests.
                  </p>
                ) : (
                  <>
                    {ops.recentFailedAudioJobs.slice(0, 2).map((job) => (
                      <Link
                        key={job.id}
                        href="/admin/audio-processing"
                        className="border-border hover:bg-muted/40 block rounded-md border px-3 py-2 transition-colors"
                      >
                        <p className="text-foreground line-clamp-1 text-sm font-medium">
                          {job.music.title}
                        </p>
                        <p className="text-muted-foreground line-clamp-1 text-xs">
                          {job.music.artist.name} &middot; {job.error || "Processing failed"}
                        </p>
                      </Link>
                    ))}
                    {ops.recentPendingApplications.slice(0, 2).map((application) => (
                      <Link
                        key={application.id}
                        href="/admin/creators"
                        className="border-border hover:bg-muted/40 block rounded-md border px-3 py-2 transition-colors"
                      >
                        <p className="text-foreground line-clamp-1 text-sm font-medium">
                          {application.displayName}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {application.type.toLowerCase()} request
                        </p>
                      </Link>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
