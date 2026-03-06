import { getFeaturedPosts } from "@/lib/api/posts";
import { getSettings } from "@/lib/settings";
import { HeroSlider } from "./HeroSlider";

export async function FeaturedPost() {
  const settings = await getSettings();
  const posts = await getFeaturedPosts({
    limit: 5,
    permalinkStructure: settings.permalinkStructure,
  });

  if (!posts.length) {
    return (
      <div className="border-border bg-card rounded-2xl border p-12 text-center">
        <p className="mb-2 text-2xl">🎵</p>
        <p className="text-muted-foreground">No featured post yet. Publish your first article!</p>
      </div>
    );
  }

  return <HeroSlider posts={posts} />;
}
