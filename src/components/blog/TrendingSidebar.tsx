import { TrendingUp } from "lucide-react";
import { PostCard } from "./PostCard";
import { getTrendingPosts } from "@/lib/api/posts";

export async function TrendingSidebar() {
  const posts = await getTrendingPosts({ limit: 5 });

  return (
    <div className="border-border bg-card rounded-xl border p-4">
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp className="text-brand h-4 w-4" />
        <h3 className="text-foreground text-sm font-bold">Trending Now</h3>
      </div>

      {posts.length === 0 ? (
        <p className="text-muted-foreground py-4 text-center text-xs">No trending posts yet.</p>
      ) : (
        <div className="divide-border divide-y">
          {posts.map((post, idx) => (
            <div key={post.id} className="flex items-start gap-3">
              <span className="text-muted/80 w-6 flex-shrink-0 pt-3 text-2xl leading-none font-black">
                {idx + 1}
              </span>
              <PostCard post={post} variant="compact" className="flex-1" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
