import Link from "next/link";
import { getLatestPosts, getPostCount } from "@/lib/api/posts";
import { getSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { FeedViewToggle } from "./FeedViewToggle";

interface LatestPostsGridProps {
  page?: number;
}

export async function LatestPostsGrid({ page = 1 }: LatestPostsGridProps) {
  const settings = await getSettings();
  const limit = settings.postsPerPage;

  const [posts, total] = await Promise.all([
    getLatestPosts({
      limit,
      page,
      permalinkStructure: settings.permalinkStructure,
    }),
    getPostCount(),
  ]);

  const totalPages = Math.ceil(total / limit);

  if (!posts.length && page === 1) {
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
    <FeedViewToggle
      posts={posts}
      initialPage={page}
      postsPerPage={limit}
      totalPages={totalPages}
      fallbackSrc={settings.postFallbackOgImage ?? settings.defaultOgImage}
    />
  );
}
