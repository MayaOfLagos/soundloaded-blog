import { Suspense } from "react";
import { TrendingSidebar } from "@/components/blog/TrendingSidebar";
import { PopularMusicSidebar } from "@/components/music/PopularMusicSidebar";
import { NewsletterForm } from "@/components/common/NewsletterForm";
import { SuggestedUsers, type SuggestedUser } from "./SuggestedUsers";
import { db } from "@/lib/db";

async function fetchSuggestedUsers(): Promise<SuggestedUser[]> {
  try {
    const users = await db.user.findMany({
      where: {
        name: { not: null },
        OR: [
          { role: { in: ["CONTRIBUTOR", "EDITOR", "ADMIN", "SUPER_ADMIN"] } },
          { posts: { some: { status: "PUBLISHED" } } },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        _count: { select: { followers: true, posts: true } },
      },
      orderBy: { followers: { _count: "desc" } },
      take: 10,
    });
    return users.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      image: u.image,
      bio: u.bio,
      followerCount: u._count.followers,
      postCount: u._count.posts,
    }));
  } catch {
    return [];
  }
}

// ── Feed Sidebar (admin-managed blocks displayed on /feed) ──
export async function FeedSidebar() {
  const initialUsers = await fetchSuggestedUsers();

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] space-y-5 overflow-y-auto pb-8 lg:block">
      {/* Suggested users — server-fetched, client-enhanced with follow buttons */}
      <SuggestedUsers initialUsers={initialUsers} />

      {/* Trending posts */}
      <Suspense fallback={<SidebarSkeleton />}>
        <TrendingSidebar />
      </Suspense>

      {/* Popular music */}
      <Suspense fallback={<SidebarSkeleton />}>
        <PopularMusicSidebar />
      </Suspense>

      {/* Newsletter */}
      <div className="from-brand/10 via-card/80 to-card ring-border/40 overflow-hidden rounded-2xl bg-gradient-to-br ring-1">
        <div className="p-4">
          <h3 className="text-foreground text-sm font-bold">Stay in the loop</h3>
          <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
            Get the latest drops, news &amp; gist delivered to your inbox.
          </p>
          <div className="mt-3">
            <NewsletterForm compact />
          </div>
        </div>
      </div>
    </aside>
  );
}

function SidebarSkeleton() {
  return (
    <div className="bg-card/50 ring-border/20 animate-pulse space-y-3 rounded-2xl p-4 ring-1">
      <div className="bg-muted h-4 w-28 rounded" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3 py-2">
          <div className="bg-muted h-9 w-9 flex-shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="bg-muted h-3 rounded" />
            <div className="bg-muted h-3 w-2/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
