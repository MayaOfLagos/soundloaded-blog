import { getLatestPosts } from "@/lib/api/posts";
import { getSettings } from "@/lib/settings";
import { PostCard } from "./PostCard";

interface CategoryMasonryGridProps {
  type: string;
  heroCount?: number;
  limit?: number;
  emptyTitle?: string;
  emptyMessage?: string;
}

export async function CategoryMasonryGrid({
  type,
  heroCount = 3,
  limit = 18,
  emptyTitle = "No posts yet",
  emptyMessage = "Check back soon!",
}: CategoryMasonryGridProps) {
  const settings = await getSettings();
  const posts = await getLatestPosts({
    type,
    limit: limit + heroCount,
    permalinkStructure: settings.permalinkStructure,
  });

  const gridPosts = posts.slice(heroCount);

  if (!gridPosts.length) {
    return (
      <div className="py-20 text-center">
        <p className="text-xl font-bold">{emptyTitle}</p>
        <p className="text-muted-foreground mt-2">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
      {gridPosts.map((post, i) => (
        <div key={post.id} className="mb-4 break-inside-avoid">
          <PostCard post={post} hideExcerpt={i % 3 === 1} />
        </div>
      ))}
    </div>
  );
}
