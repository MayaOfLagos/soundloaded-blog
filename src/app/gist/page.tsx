import { Suspense } from "react";
import type { Metadata } from "next";
import { CategoryTabs } from "@/components/blog/CategoryTabs";
import { PostCard } from "@/components/blog/PostCard";
import { PostCardSkeleton } from "@/components/blog/PostCardSkeleton";
import { getLatestPosts } from "@/lib/api/posts";

export const metadata: Metadata = {
  title: "Gist",
  description: "Nigerian entertainment gist, celebrity news, and industry gossip.",
};

export const revalidate = 60;

export default async function GistPage() {
  return (
    <>
      <CategoryTabs />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="text-foreground text-2xl font-black">Gist 🔥</h1>
          <p className="text-muted-foreground mt-1">
            Nigerian entertainment gist, celebrity news, and industry gossip.
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
          <GistGrid />
        </Suspense>
      </div>
    </>
  );
}

async function GistGrid() {
  const posts = await getLatestPosts({ type: "GIST", limit: 18 });

  if (!posts.length) {
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-4xl">🔥</p>
        <p className="text-xl font-bold">No gist yet</p>
        <p className="text-muted-foreground mt-2">The gist is coming soon!</p>
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
