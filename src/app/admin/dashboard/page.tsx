import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Music, Users, Download, TrendingUp, Eye, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { StatsCard } from "@/components/admin/StatsCard";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/blog/PostCard";

export const metadata: Metadata = { title: "Dashboard — Soundloaded Admin" };

async function getDashboardStats() {
  try {
    const [
      totalPosts,
      publishedPosts,
      totalMusic,
      totalArtists,
      totalSubscribers,
      totalDownloads,
      recentPosts,
    ] = await Promise.all([
      db.post.count(),
      db.post.count({ where: { status: "PUBLISHED" } }),
      db.music.count(),
      db.artist.count(),
      db.subscriber.count({ where: { status: "CONFIRMED" } }),
      db.download.count(),
      db.post.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 4,
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          coverImage: true,
          publishedAt: true,
          views: true,
          category: { select: { name: true, slug: true } },
          author: { select: { name: true, image: true } },
        },
      }),
    ]);

    return {
      totalPosts,
      publishedPosts,
      totalMusic,
      totalArtists,
      totalSubscribers,
      totalDownloads,
      recentPosts,
    };
  } catch {
    return {
      totalPosts: 0,
      publishedPosts: 0,
      totalMusic: 0,
      totalArtists: 0,
      totalSubscribers: 0,
      totalDownloads: 0,
      recentPosts: [],
    };
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const statsCards = [
    {
      title: "Total Posts",
      value: stats.totalPosts,
      subtitle: `${stats.publishedPosts} published`,
      icon: <FileText className="text-brand h-5 w-5" />,
    },
    {
      title: "Music Tracks",
      value: stats.totalMusic,
      subtitle: "uploaded to R2",
      icon: <Music className="text-brand h-5 w-5" />,
    },
    {
      title: "Artists",
      value: stats.totalArtists,
      icon: <Users className="text-brand h-5 w-5" />,
    },
    {
      title: "Total Downloads",
      value: stats.totalDownloads,
      icon: <Download className="text-success h-5 w-5" />,
    },
    {
      title: "Subscribers",
      value: stats.totalSubscribers,
      subtitle: "confirmed",
      icon: <TrendingUp className="text-success h-5 w-5" />,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-black">Dashboard</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Welcome back! Here&apos;s what&apos;s happening on Soundloaded Blog.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/posts/new">
            <Button size="sm" className="bg-brand hover:bg-brand/90 text-brand-foreground gap-1.5">
              <Plus className="h-4 w-4" />
              New Post
            </Button>
          </Link>
          <Link href="/admin/music/upload">
            <Button size="sm" variant="outline" className="gap-1.5">
              <Music className="h-4 w-4" />
              Upload Music
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {statsCards.map((card) => (
          <StatsCard key={card.title} {...card} />
        ))}
      </div>

      {/* Recent posts */}
      {stats.recentPosts.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-foreground text-base font-bold">Recent Posts</h2>
            <Link href="/admin/posts" className="text-brand text-sm hover:underline">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.recentPosts.map((post) => (
              <PostCard
                key={post.id}
                post={{
                  ...post,
                  viewCount: post.views,
                  publishedAt: post.publishedAt ?? new Date(),
                  author: post.author.name
                    ? { name: post.author.name, avatar: post.author.image }
                    : null,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
