import Link from "next/link";
import { getLatestPosts } from "@/lib/api/posts";
import { getSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { FeedViewToggle } from "./FeedViewToggle";

export async function LatestPostsGrid() {
  const settings = await getSettings();
  const posts = await getLatestPosts({
    limit: settings.postsPerPage,
    permalinkStructure: settings.permalinkStructure,
  });

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

  return <FeedViewToggle posts={posts} />;
}
