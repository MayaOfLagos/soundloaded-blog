import { getFeaturedPostsByType } from "@/lib/api/posts";
import { getSettings } from "@/lib/settings";
import { VideoHeroSlider } from "./VideoHeroSlider";
import { Play } from "lucide-react";

export async function VideoHero() {
  const settings = await getSettings();
  const posts = await getFeaturedPostsByType({
    type: "VIDEO",
    limit: 3,
    permalinkStructure: settings.permalinkStructure,
  });

  if (!posts.length) {
    return (
      <div className="border-border bg-card flex aspect-video items-center justify-center rounded-2xl border">
        <div className="text-center">
          <Play className="text-muted-foreground/30 mx-auto mb-3 h-12 w-12" />
          <p className="text-muted-foreground">No videos yet. Check back soon!</p>
        </div>
      </div>
    );
  }

  return <VideoHeroSlider posts={posts} />;
}
