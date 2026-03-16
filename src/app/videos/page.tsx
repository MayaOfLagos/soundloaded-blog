import { Suspense } from "react";
import type { Metadata } from "next";
import { LeftSidebar } from "@/components/home/LeftSidebar";
import { VideoHero } from "@/components/blog/VideoHero";
import { VideoCard } from "@/components/blog/VideoCard";
import { VideoCardSkeleton } from "@/components/blog/VideoCardSkeleton";
import { TrendingSidebar } from "@/components/blog/TrendingSidebar";
import { PopularMusicSidebar } from "@/components/music/PopularMusicSidebar";
import { NewsletterForm } from "@/components/common/NewsletterForm";
import { getLatestPosts } from "@/lib/api/posts";
import { getSettings } from "@/lib/settings";
import { SectionDisabled } from "@/components/common/SectionDisabled";
import { JsonLd } from "@/components/common/JsonLd";
import { buildCollectionPageSchema } from "@/lib/structured-data";

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
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-6 py-5 lg:grid-cols-[1fr_300px] xl:grid-cols-[220px_1fr_300px]">
          <LeftSidebar />

          <main className="min-w-0">
            {/* Video Hero */}
            <section className="mb-6">
              <Suspense fallback={<VideoHeroSkeleton />}>
                <VideoHero />
              </Suspense>
            </section>

            {/* Section header */}
            <div className="mb-5">
              <h1 className="text-foreground text-2xl font-black">Videos</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Watch the latest music videos, interviews, and behind-the-scenes content.
              </p>
            </div>

            {/* Video grid */}
            <Suspense fallback={<VideoGridSkeleton />}>
              <VideoGrid />
            </Suspense>

            {/* Mobile-only sidebars */}
            <div className="mt-8 space-y-5 lg:hidden">
              <Suspense fallback={<SidebarBlockSkeleton />}>
                <TrendingSidebar />
              </Suspense>
              <Suspense fallback={<SidebarBlockSkeleton />}>
                <PopularMusicSidebar />
              </Suspense>
              <MobileNewsletter />
            </div>
          </main>

          {/* Right Sidebar */}
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

async function VideoGrid() {
  const settings = await getSettings();
  const posts = await getLatestPosts({
    type: "VIDEO",
    limit: 21,
    permalinkStructure: settings.permalinkStructure,
  });

  // Skip first 3 (shown in hero)
  const gridPosts = posts.slice(3);

  if (!gridPosts.length) {
    return (
      <div className="py-20 text-center">
        <p className="text-xl font-bold">No videos yet</p>
        <p className="text-muted-foreground mt-2">Videos will appear here once published.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {gridPosts.map((post) => (
        <VideoCard key={post.id} post={post} />
      ))}
    </div>
  );
}

/* ━━━ Skeletons ━━━ */

function VideoHeroSkeleton() {
  return (
    <div className="bg-muted ring-border/20 relative aspect-video animate-pulse overflow-hidden rounded-3xl ring-1">
      {/* Fake play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-muted-foreground/10 h-16 w-16 rounded-full sm:h-20 sm:w-20" />
      </div>
      {/* Fake video badge */}
      <div className="absolute top-4 left-4">
        <div className="bg-muted-foreground/10 h-6 w-16 rounded-lg" />
      </div>
      {/* Fake progress bars */}
      <div className="absolute right-0 bottom-0 left-0 flex gap-1 px-4 pb-2">
        <div className="bg-muted-foreground/10 h-1 flex-1 rounded-full" />
        <div className="bg-muted-foreground/10 h-1 flex-1 rounded-full" />
        <div className="bg-muted-foreground/10 h-1 flex-1 rounded-full" />
      </div>
    </div>
  );
}

function VideoGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <VideoCardSkeleton key={i} />
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

function MobileNewsletter() {
  return (
    <div className="from-brand/10 via-card/80 to-card ring-border/40 overflow-hidden rounded-2xl bg-gradient-to-br ring-1">
      <div className="p-5">
        <h3 className="text-foreground font-bold">Stay in the loop</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Get the latest drops, news &amp; gist right in your inbox.
        </p>
        <div className="mt-3">
          <NewsletterForm compact />
        </div>
      </div>
    </div>
  );
}
