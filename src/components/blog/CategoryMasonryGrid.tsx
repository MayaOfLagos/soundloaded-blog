import { getLatestPosts } from "@/lib/api/posts";
import { getSettings } from "@/lib/settings";
import { PostCard } from "./PostCard";
import { Newspaper } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";

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
      <EmptyState
        icon={Newspaper}
        title={emptyTitle}
        description={emptyMessage}
        actionLabel="Go Home"
        actionHref="/"
      />
    );
  }

  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
      {gridPosts.map((post, i) => (
        <div key={post.id} className="mb-4 break-inside-avoid">
          <PostCard
            post={post}
            hideExcerpt={i % 3 === 1}
            fallbackSrc={settings.postFallbackOgImage ?? settings.defaultOgImage}
          />
        </div>
      ))}
    </div>
  );
}
