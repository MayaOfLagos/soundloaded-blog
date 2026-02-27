import Link from "next/link";
import { PostCard } from "./PostCard";
import { getLatestPosts } from "@/lib/api/posts";
import { Button } from "@/components/ui/button";

export async function LatestPostsGrid() {
  const posts = await getLatestPosts({ limit: 12 });

  if (!posts.length) {
    return (
      <div className="border-border bg-card rounded-xl border p-10 text-center">
        <p className="mb-2 text-3xl">📝</p>
        <p className="text-foreground font-semibold">No articles yet</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Posts published from the admin will appear here.
        </p>
        <Link href="/admin/posts/new">
          <Button className="bg-brand hover:bg-brand/90 text-brand-foreground mt-4" size="sm">
            Write your first article
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
