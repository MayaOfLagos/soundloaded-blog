import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { CategoryTabs } from "@/components/blog/CategoryTabs";
import { FeaturedPost } from "@/components/blog/FeaturedPost";
import { LatestPostsGrid } from "@/components/blog/LatestPostsGrid";
import { TrendingSidebar } from "@/components/blog/TrendingSidebar";
import { PopularMusicSidebar } from "@/components/music/PopularMusicSidebar";
import { PostCardSkeleton } from "@/components/blog/PostCardSkeleton";

export const metadata: Metadata = {
  title: "Soundloaded Blog — Nigeria's #1 Music Blog",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <CategoryTabs />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Featured post — hero */}
        <section className="mb-8">
          <Suspense fallback={<PostCardSkeleton variant="featured" className="aspect-[16/8]" />}>
            <FeaturedPost />
          </Suspense>
        </section>

        {/* Main content + sidebar */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          {/* Latest posts */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-foreground text-lg font-bold">Latest</h2>
              <Link href="/news" className="text-brand text-sm font-medium hover:underline">
                View all
              </Link>
            </div>
            <Suspense
              fallback={
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <PostCardSkeleton key={i} />
                  ))}
                </div>
              }
            >
              <LatestPostsGrid />
            </Suspense>
          </section>

          {/* Sidebar */}
          <aside className="space-y-6">
            <Suspense fallback={<TrendingSidebarSkeleton />}>
              <TrendingSidebar />
            </Suspense>
            <Suspense fallback={<TrendingSidebarSkeleton />}>
              <PopularMusicSidebar />
            </Suspense>
          </aside>
        </div>
      </div>
    </>
  );
}

function TrendingSidebarSkeleton() {
  return (
    <div className="border-border bg-card space-y-3 rounded-xl border p-4">
      <div className="bg-muted h-4 w-24 animate-pulse rounded" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3 py-2">
          <div className="bg-muted h-12 w-16 flex-shrink-0 animate-pulse rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="bg-muted h-3 animate-pulse rounded" />
            <div className="bg-muted h-3 w-2/3 animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
