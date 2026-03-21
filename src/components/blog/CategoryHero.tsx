import { getFeaturedPostsByType } from "@/lib/api/posts";
import { getSettings } from "@/lib/settings";
import { HeroSlider } from "./HeroSlider";
import { Sparkles } from "lucide-react";

interface CategoryHeroProps {
  type: string;
  limit?: number;
  emptyMessage?: string;
}

export async function CategoryHero({
  type,
  limit = 3,
  emptyMessage = "Featured content will appear here once published. Stay tuned!",
}: CategoryHeroProps) {
  const settings = await getSettings();
  const posts = await getFeaturedPostsByType({
    type,
    limit,
    permalinkStructure: settings.permalinkStructure,
  });

  if (!posts.length) {
    return (
      <div className="border-border bg-card flex aspect-[21/9] items-center justify-center rounded-2xl border">
        <div className="text-center">
          <div className="bg-muted/50 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl">
            <Sparkles className="text-muted-foreground h-6 w-6" />
          </div>
          <p className="text-muted-foreground text-sm">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return <HeroSlider posts={posts} />;
}
