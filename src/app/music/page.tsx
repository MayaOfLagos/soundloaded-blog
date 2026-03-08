import { Suspense } from "react";
import type { Metadata } from "next";
import { LeftSidebar } from "@/components/home/LeftSidebar";
import { MusicCard } from "@/components/music/MusicCard";
import { TrendingSidebar } from "@/components/blog/TrendingSidebar";
import { PopularMusicSidebar } from "@/components/music/PopularMusicSidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { NewsletterForm } from "@/components/common/NewsletterForm";
import { getLatestMusic } from "@/lib/api/music";
import { getSettings } from "@/lib/settings";
import { JsonLd } from "@/components/common/JsonLd";
import { buildCollectionPageSchema } from "@/lib/structured-data";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const description = `Download the latest Afrobeats, Afropop, and Nigerian music for free on ${s.siteName}.`;
  return {
    title: "Free Music Downloads",
    description,
    alternates: { canonical: "/music" },
    openGraph: {
      title: `Free Music Downloads | ${s.siteName}`,
      description,
      images: s.defaultOgImage ? [{ url: s.defaultOgImage }] : [],
    },
  };
}

export const revalidate = 60;

export default async function MusicPage() {
  const settings = await getSettings();
  const schema = buildCollectionPageSchema(
    "Free Music Downloads",
    `Download the latest Afrobeats and Nigerian music on ${settings.siteName}.`,
    "/music",
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
              <h1 className="text-foreground text-2xl font-black">Free Music Downloads</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Download the latest Afrobeats, Afropop, and Nigerian music for free.
              </p>
            </div>

            <Suspense fallback={<MusicGridSkeleton />}>
              <MusicGrid />
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

async function MusicGrid() {
  const tracks = await getLatestMusic({ limit: 20 });

  if (!tracks.length) {
    return (
      <div className="py-20 text-center">
        <p className="text-xl font-bold">No music uploaded yet</p>
        <p className="text-muted-foreground mt-2">
          Music will appear here once uploaded from the admin panel.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {tracks.map((track) => (
        <MusicCard key={track.id} track={track} />
      ))}
    </div>
  );
}

function MusicGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="border-border overflow-hidden rounded-xl border">
          <Skeleton className="aspect-square w-full" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="mt-1 h-7 w-full" />
          </div>
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
