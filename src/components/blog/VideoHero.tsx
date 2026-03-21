import { getFeaturedPostsByType } from "@/lib/api/posts";
import { getSettings } from "@/lib/settings";
import { VideoHeroSlider } from "./VideoHeroSlider";
import { PlaySquare } from "lucide-react";

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
          <div className="bg-muted/50 mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl">
            <PlaySquare className="text-muted-foreground h-7 w-7" />
          </div>
          <p className="text-foreground text-sm font-semibold">No featured videos yet</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Videos will appear here once published.
          </p>
        </div>
      </div>
    );
  }

  return <VideoHeroSlider posts={posts} />;
}
