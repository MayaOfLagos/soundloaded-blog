import { Suspense } from "react";
import type { Metadata } from "next";
import { CategoryTabs } from "@/components/blog/CategoryTabs";
import { PostCard } from "@/components/blog/PostCard";
import { PostCardSkeleton } from "@/components/blog/PostCardSkeleton";
import { getLatestPosts } from "@/lib/api/posts";

export const metadata: Metadata = {
  title: "Music News",
  description: "Latest Nigerian and African music news, updates, industry gist, and more.",
};

export const revalidate = 60;

export default async function NewsPage() {
  return (
    <>
      <CategoryTabs />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="text-foreground text-2xl font-black">Music News</h1>
          <p className="text-muted-foreground mt-1">
            Latest Nigerian and African music news, interviews, and industry updates.
          </p>
        </div>
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <PostCardSkeleton key={i} />
              ))}
            </div>
          }
        >
          <NewsGrid />
        </Suspense>
      </div>
    </>
  );
}

async function NewsGrid() {
  const posts = await getLatestPosts({ type: "NEWS", limit: 18 });

  if (!posts.length) {
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-4xl">📰</p>
        <p className="text-xl font-bold">No news articles yet</p>
        <p className="text-muted-foreground mt-2">Check back soon for the latest music news!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
