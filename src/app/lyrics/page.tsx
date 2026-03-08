import { Suspense } from "react";
import type { Metadata } from "next";
import { LeftSidebar } from "@/components/home/LeftSidebar";
import { CategoryHero } from "@/components/blog/CategoryHero";
import { CategoryMasonryGrid } from "@/components/blog/CategoryMasonryGrid";
import { TrendingSidebar } from "@/components/blog/TrendingSidebar";
import { PopularMusicSidebar } from "@/components/music/PopularMusicSidebar";
import { PostCardSkeleton } from "@/components/blog/PostCardSkeleton";
import { NewsletterForm } from "@/components/common/NewsletterForm";
import { getSettings } from "@/lib/settings";
import { JsonLd } from "@/components/common/JsonLd";
import { buildCollectionPageSchema } from "@/lib/structured-data";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const description = `Song lyrics for the latest Afrobeats, Afropop, and Nigerian music on ${s.siteName}.`;
  return {
    title: "Lyrics",
    description,
    alternates: { canonical: "/lyrics" },
    openGraph: {
      title: `Lyrics | ${s.siteName}`,
      description,
      images: s.defaultOgImage ? [{ url: s.defaultOgImage }] : [],
    },
  };
}

export const revalidate = 60;

export default async function LyricsPage() {
  const settings = await getSettings();
  const schema = buildCollectionPageSchema(
    "Lyrics",
    `Song lyrics for the latest Nigerian and African music on ${settings.siteName}.`,
    "/lyrics",
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
            <section className="mb-6">
              <Suspense fallback={<HeroSkeleton />}>
                <CategoryHero
                  type="LYRICS"
                  emptyMessage="No featured lyrics yet. Check back soon!"
                />
              </Suspense>
            </section>

            <div className="mb-5">
              <h1 className="text-foreground text-2xl font-black">Lyrics</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Song lyrics for the latest Afrobeats, Afropop, and Nigerian music.
              </p>
            </div>

            <Suspense fallback={<MasonrySkeleton />}>
              <CategoryMasonryGrid
                type="LYRICS"
                heroCount={3}
                emptyTitle="No lyrics yet"
                emptyMessage="Lyrics will appear here once published!"
              />
            </Suspense>

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

function HeroSkeleton() {
  return (
    <div className="bg-muted ring-border/20 aspect-[16/9] animate-pulse rounded-3xl ring-1 sm:aspect-[21/9]" />
  );
}

function MasonrySkeleton() {
  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="mb-4 break-inside-avoid">
          <PostCardSkeleton />
        </div>
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
