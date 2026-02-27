import { PostCard } from "./PostCard";
import { getFeaturedPost } from "@/lib/api/posts";

export async function FeaturedPost() {
  const post = await getFeaturedPost();

  if (!post) {
    return (
      <div className="border-border bg-card rounded-2xl border p-12 text-center">
        <p className="mb-2 text-2xl">🎵</p>
        <p className="text-muted-foreground">No featured post yet. Publish your first article!</p>
      </div>
    );
  }

  return <PostCard post={post} variant="featured" />;
}
