import { Suspense } from "react";
import type { Metadata } from "next";
import { VideoHero } from "@/components/blog/VideoHero";
import { VideoCardSkeleton } from "@/components/blog/VideoCardSkeleton";
import { VideosInfiniteGrid } from "./VideosInfiniteGrid";
import { VideosPageClient } from "./VideosPageClient";
import { getLatestPosts, getVideoCategories } from "@/lib/api/posts";
import { getSettings } from "@/lib/settings";
import { SectionDisabled } from "@/components/common/SectionDisabled";
import { JsonLd } from "@/components/common/JsonLd";
import { buildCollectionPageSchema } from "@/lib/structured-data";
import type { PostCardData } from "@/components/blog/PostCard";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const description = `Watch the latest Nigerian and African music videos, interviews, and behind-the-scenes content on ${s.siteName}.`;
  return {
    title: "Videos",
    description,
    alternates: { canonical: "/videos" },
    openGraph: {
      title: `Videos | ${s.siteName}`,
      description,
      images: s.defaultOgImage ? [{ url: s.defaultOgImage }] : [],
    },
  };
}

export const revalidate = 60;

export default async function VideosPage() {
  const settings = await getSettings();
  if (!settings.enableVideos) return <SectionDisabled section="Videos" />;

  const [categories] = await Promise.all([getVideoCategories()]);

  const schema = buildCollectionPageSchema(
    "Videos",
    `Watch the latest Nigerian and African music videos on ${settings.siteName}.`,
    "/videos",
    settings.siteUrl,
    settings.siteName
  );

  return (
    <>
      <JsonLd schema={[schema]} />
      <VideosPageClient categories={categories}>
        {/* Video Hero Slider */}
        <section className="mb-8 max-w-4xl">
          <Suspense fallback={<VideoHeroSkeleton />}>
            <VideoHero />
          </Suspense>
        </section>

        {/* Subtitle */}
        <p className="text-muted-foreground mb-6 text-sm">
          Watch the latest music videos, interviews, and behind-the-scenes content.
        </p>

        {/* Video grid with infinite scroll */}
        <Suspense fallback={<VideoGridSkeleton />}>
          <VideoGridLoader permalinkStructure={settings.permalinkStructure} />
        </Suspense>
      </VideosPageClient>
    </>
  );
}

async function VideoGridLoader({ permalinkStructure }: { permalinkStructure: string }) {
  const heroCount = 3;
  const initialLimit = 20 + heroCount; // 20 for grid + 3 for hero
  const posts = await getLatestPosts({
    type: "VIDEO",
    limit: initialLimit,
    permalinkStructure,
  });

  // Skip hero posts
  const gridPosts: PostCardData[] = posts.slice(heroCount);
  const hasNext = posts.length >= initialLimit;

  return (
    <VideosInfiniteGrid
      initialPosts={gridPosts}
      initialHasNext={hasNext}
      heroCount={heroCount}
      permalinkStructure={permalinkStructure}
    />
  );
}

/* ━━━ Skeletons ━━━ */

function VideoHeroSkeleton() {
  return (
    <div className="bg-muted relative aspect-video animate-pulse overflow-hidden rounded-3xl">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-muted-foreground/10 h-16 w-16 rounded-full sm:h-20 sm:w-20" />
      </div>
      <div className="absolute top-4 left-4">
        <div className="bg-muted-foreground/10 h-6 w-16 rounded-lg" />
      </div>
      <div className="absolute right-0 bottom-0 left-0 flex gap-1.5 px-5 pb-3">
        <div className="bg-muted-foreground/10 h-[3px] flex-1 rounded-full" />
        <div className="bg-muted-foreground/10 h-[3px] flex-1 rounded-full" />
        <div className="bg-muted-foreground/10 h-[3px] flex-1 rounded-full" />
      </div>
    </div>
  );
}

function VideoGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <VideoCardSkeleton key={i} />
      ))}
    </div>
  );
}
