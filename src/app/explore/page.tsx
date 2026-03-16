import { Suspense } from "react";
import type { Metadata } from "next";
import { LeftSidebar } from "@/components/home/LeftSidebar";
import { TrendingSidebar } from "@/components/blog/TrendingSidebar";
import { PopularMusicSidebar } from "@/components/music/PopularMusicSidebar";
import { NewsletterForm } from "@/components/common/NewsletterForm";
import { ExploreFeed } from "@/components/explore/ExploreFeed";
import { ExploreCardSkeleton } from "@/components/explore/ExploreCardSkeleton";
import { StoryTraySkeleton } from "@/components/stories/StoryTraySkeleton";
import { getSettings } from "@/lib/settings";
import { SectionDisabled } from "@/components/common/SectionDisabled";
import { JsonLd } from "@/components/common/JsonLd";
import { buildCollectionPageSchema } from "@/lib/structured-data";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const title = `Explore | ${s.siteName}`;
  const description = `Explore trending, latest, and hot content across music, news, gist, and more on ${s.siteName}.`;
  const ogImage = s.defaultOgImage
    ? [{ url: s.defaultOgImage, width: 1200, height: 630, alt: title }]
    : [];
  return {
    title: "Explore",
    description,
    alternates: { canonical: "/explore" },
    openGraph: {
      title,
      description,
      url: `${s.siteUrl}/explore`,
      siteName: s.siteName,
      type: "website",
      images: ogImage,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(s.defaultOgImage ? { images: [s.defaultOgImage] } : {}),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export const revalidate = 60;

export default async function ExplorePage() {
  const settings = await getSettings();
  if (!settings.enableExplore) return <SectionDisabled section="Explore" />;
  const schema = buildCollectionPageSchema(
    "Explore",
    `Discover trending, latest, and hot content on ${settings.siteName}.`,
    "/explore",
    settings.siteUrl,
    settings.siteName
  );

  return (
    <>
      <JsonLd schema={[schema]} />
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-6 py-5 lg:grid-cols-[1fr_300px] xl:grid-cols-[220px_1fr_300px]">
          <LeftSidebar />

          <main className="min-w-0">
            <Suspense fallback={<ExploreFeedSkeleton />}>
              <ExploreFeed enableStories={settings.enableStories} />
            </Suspense>
          </main>

          <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] space-y-5 overflow-y-auto pb-8 lg:block">
            <Suspense fallback={<SidebarBlockSkeleton />}>
              <TrendingSidebar />
            </Suspense>
            <Suspense fallback={<SidebarBlockSkeleton />}>
              <PopularMusicSidebar />
            </Suspense>
            <div className="from-brand/10 via-card/80 to-card ring-border/40 overflow-hidden rounded-2xl bg-gradient-to-br ring-1">
              <div className="p-4">
                <h3 className="text-foreground text-sm font-bold">Stay in the loop</h3>
                <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
                  Get the latest drops, news &amp; gist delivered to your inbox.
                </p>
                <div className="mt-3">
                  <NewsletterForm compact />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

function ExploreFeedSkeleton() {
  return (
    <div className="mx-auto w-full max-w-lg space-y-4 sm:max-w-xl">
      {/* Story tray skeleton */}
      <StoryTraySkeleton />
      {/* Cards skeleton */}
      {Array.from({ length: 3 }).map((_, i) => (
        <ExploreCardSkeleton key={i} />
      ))}
    </div>
  );
}

function SidebarBlockSkeleton() {
  return (
    <div className="bg-card/50 ring-border/20 animate-pulse space-y-3 rounded-2xl p-4 ring-1">
      <div className="bg-muted h-4 w-28 rounded" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3 py-2">
          <div className="bg-muted h-14 w-14 flex-shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="bg-muted h-3 rounded" />
            <div className="bg-muted h-3 w-2/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
