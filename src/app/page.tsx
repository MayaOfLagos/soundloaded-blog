import { Suspense } from "react";
import type { Metadata } from "next";
import { LeftSidebar } from "@/components/home/LeftSidebar";
import { FeaturedPost } from "@/components/blog/FeaturedPost";
import { LatestPostsGrid } from "@/components/blog/LatestPostsGrid";
import { TrendingSidebar } from "@/components/blog/TrendingSidebar";
import { PopularMusicSidebar } from "@/components/music/PopularMusicSidebar";
import { FeedViewSkeleton } from "@/components/blog/FeedViewSkeleton";
import { NewsletterForm } from "@/components/common/NewsletterForm";
import { getSettings } from "@/lib/settings";
import { JsonLd } from "@/components/common/JsonLd";
import { buildWebSiteSchema, buildOrganizationSchema } from "@/lib/structured-data";

/** Revalidate the homepage every 60 seconds (ISR) */
export const revalidate = 60;

interface HomePageProps {
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ searchParams }: HomePageProps): Promise<Metadata> {
  const s = await getSettings();
  const { page } = await searchParams;
  const pageNum = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const title = pageNum > 1 ? `${s.siteName} — Page ${pageNum}` : `${s.siteName} — ${s.tagline}`;

  return {
    title,
    alternates: { canonical: pageNum > 1 ? `/?page=${pageNum}` : "/" },
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const settings = await getSettings();
  const websiteSchema = buildWebSiteSchema(settings.siteName, settings.siteUrl);
  const orgSchema = buildOrganizationSchema(
    settings.siteName,
    settings.siteUrl,
    settings.logoLight
  );

  return (
    <>
      <JsonLd schema={[websiteSchema, orgSchema]} />
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
        {/* ━━━ Three-column grid ━━━
          Mobile:  single column (left sidebar hidden, right sidebar below feed)
          lg:      2 columns — feed + right sidebar
          xl:      3 columns — left sidebar + feed + right sidebar
      */}
        <div className="grid grid-cols-1 gap-6 py-5 lg:grid-cols-[1fr_300px] xl:grid-cols-[220px_1fr_300px]">
          {/* ── LEFT SIDEBAR (xl+ only) ── */}
          <LeftSidebar />

          {/* ── MAIN CONTENT ── */}
          <main className="min-w-0">
            {/* Hero / Featured post */}
            <section className="mb-6">
              <Suspense fallback={<HeroSkeleton />}>
                <FeaturedPost />
              </Suspense>
            </section>

            {/* Feed grid with view toggle */}
            <Suspense fallback={<FeedSkeleton />}>
              <LatestPostsGrid page={currentPage} />
            </Suspense>

            {/* ── Mobile-only: Right sidebar content below feed ── */}
            <div className="mt-8 space-y-5 lg:hidden">
              <TrendingSidebarBlock />
              <PopularMusicBlock />
              <MobileNewsletter />
            </div>
          </main>

          {/* ── RIGHT SIDEBAR (lg+ only) ── */}
          <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] space-y-5 overflow-y-auto pb-8 lg:block">
            <TrendingSidebarBlock />
            <PopularMusicBlock />

            {/* Newsletter signup */}
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

/* ━━━ Deduplicated sidebar wrappers (Suspense + single component) ━━━ */

function TrendingSidebarBlock() {
  return (
    <Suspense fallback={<SidebarBlockSkeleton />}>
      <TrendingSidebar />
    </Suspense>
  );
}

function PopularMusicBlock() {
  return (
    <Suspense fallback={<SidebarBlockSkeleton />}>
      <PopularMusicSidebar />
    </Suspense>
  );
}

/* ━━━ Skeleton loaders ━━━ */

function HeroSkeleton() {
  return (
    <div className="bg-muted ring-border/20 aspect-video animate-pulse rounded-3xl ring-1 sm:aspect-21/9" />
  );
}

function FeedSkeleton() {
  return <FeedViewSkeleton count={12} />;
}

function SidebarBlockSkeleton() {
  return (
    <div className="bg-card/50 ring-border/20 space-y-3 rounded-2xl p-4 ring-1">
      <div className="bg-muted h-4 w-28 animate-pulse rounded" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3 py-2">
          <div className="bg-muted h-14 w-14 shrink-0 animate-pulse rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="bg-muted h-3 animate-pulse rounded" />
            <div className="bg-muted h-3 w-2/3 animate-pulse rounded" />
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
