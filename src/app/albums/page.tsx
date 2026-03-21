import { Suspense } from "react";
import type { Metadata } from "next";
import { LeftSidebar } from "@/components/home/LeftSidebar";
import { TrendingSidebar } from "@/components/blog/TrendingSidebar";
import { PopularMusicSidebar } from "@/components/music/PopularMusicSidebar";
import { NewsletterForm } from "@/components/common/NewsletterForm";
import { getLatestAlbums } from "@/lib/api/music";
import { getSettings } from "@/lib/settings";
import { SectionDisabled } from "@/components/common/SectionDisabled";
import { JsonLd } from "@/components/common/JsonLd";
import { buildCollectionPageSchema } from "@/lib/structured-data";
import { AlbumsInfiniteGrid, AlbumsGridSkeleton } from "./AlbumsInfiniteGrid";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const description = `Browse and download Nigerian music albums and EPs on ${s.siteName}.`;
  return {
    title: "Albums & EPs",
    description,
    alternates: { canonical: "/albums" },
    openGraph: {
      title: `Albums & EPs | ${s.siteName}`,
      description,
      images: s.defaultOgImage ? [{ url: s.defaultOgImage }] : [],
    },
  };
}

export const revalidate = 300;

export default async function AlbumsPage() {
  const settings = await getSettings();
  if (!settings.enableAlbums) return <SectionDisabled section="Albums" />;
  const schema = buildCollectionPageSchema(
    "Albums & EPs",
    `Browse and download Nigerian music albums and EPs on ${settings.siteName}.`,
    "/albums",
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
            <div className="mb-5">
              <h1 className="text-foreground text-2xl font-black">Albums & EPs</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Browse and download Nigerian music albums and EPs.
              </p>
            </div>

            <Suspense fallback={<AlbumsGridSkeleton />}>
              <AlbumsGridLoader />
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

async function AlbumsGridLoader() {
  const { albums, nextCursor } = await getLatestAlbums({ limit: 20 });

  return <AlbumsInfiniteGrid initialAlbums={albums} initialNextCursor={nextCursor} />;
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
