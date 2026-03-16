import { Suspense } from "react";
import { TrendingSidebar } from "@/components/blog/TrendingSidebar";
import { PopularMusicSidebar } from "@/components/music/PopularMusicSidebar";
import { NewsletterForm } from "@/components/common/NewsletterForm";
import { db } from "@/lib/db";

// ── Suggested users to follow ──
async function fetchSuggestedUsers() {
  try {
    return await db.user.findMany({
      where: {
        role: { in: ["CONTRIBUTOR", "EDITOR", "ADMIN", "SUPER_ADMIN"] },
        name: { not: null },
      },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        _count: { select: { posts: true, followers: true } },
      },
    });
  } catch {
    return [];
  }
}

async function SuggestedUsers() {
  const users = await fetchSuggestedUsers();

  if (users.length === 0) return null;

  return (
    <div className="bg-card/50 ring-border/40 rounded-2xl p-4 ring-1 backdrop-blur-sm">
      <h3 className="text-foreground mb-3 text-sm font-bold">Suggested for you</h3>
      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-3">
            <div className="bg-muted flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={user.name || ""}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-muted-foreground text-xs font-semibold">
                  {user.name?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate text-[13px] font-semibold">{user.name}</p>
              <p className="text-muted-foreground text-[11px]">
                {user._count.posts} posts · {user._count.followers} followers
              </p>
            </div>
            <button className="bg-brand/10 text-brand hover:bg-brand/20 rounded-full px-3 py-1 text-[11px] font-semibold transition-colors">
              Follow
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Feed Sidebar (admin-managed blocks displayed on /feed) ──
export function FeedSidebar() {
  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] space-y-5 overflow-y-auto pb-8 lg:block">
      {/* Suggested users */}
      <Suspense fallback={<SidebarSkeleton />}>
        <SuggestedUsers />
      </Suspense>

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
