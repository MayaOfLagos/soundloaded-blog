import { getFeaturedPostsByType } from "@/lib/api/posts";
import { getSettings } from "@/lib/settings";
import { HeroSlider } from "./HeroSlider";

interface CategoryHeroProps {
  type: string;
  limit?: number;
  emptyMessage?: string;
}

export async function CategoryHero({
  type,
  limit = 3,
  emptyMessage = "No featured posts yet. Check back soon!",
}: CategoryHeroProps) {
  const settings = await getSettings();
  const posts = await getFeaturedPostsByType({
    type,
    limit,
    permalinkStructure: settings.permalinkStructure,
  });

  if (!posts.length) {
    return (
      <div className="border-border bg-card rounded-2xl border p-12 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return <HeroSlider posts={posts} />;
}
