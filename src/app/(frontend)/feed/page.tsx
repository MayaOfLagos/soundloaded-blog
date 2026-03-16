import { Suspense } from "react";
import type { Metadata } from "next";
import { LeftSidebar } from "@/components/home/LeftSidebar";
import { FeedSidebar } from "@/components/feed/FeedSidebar";
import { FeedContent } from "@/components/feed/FeedContent";
import { TrendingSidebar } from "@/components/blog/TrendingSidebar";
import { PopularMusicSidebar } from "@/components/music/PopularMusicSidebar";
import { NewsletterForm } from "@/components/common/NewsletterForm";
import { getSettings } from "@/lib/settings";
import { SectionDisabled } from "@/components/common/SectionDisabled";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: `Feed — ${s.siteName}`,
    description: "See what's happening on the Soundloaded community.",
  };
}

export default async function FeedPage() {
  const settings = await getSettings();
  if (!settings.enableFeed) return <SectionDisabled section="Feed" />;

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
      <div className="grid grid-cols-1 gap-6 py-5 lg:grid-cols-[1fr_300px] xl:grid-cols-[220px_1fr_300px]">
        {/* ── LEFT SIDEBAR (xl+ only) ── */}
        <LeftSidebar />

        {/* ── MAIN CONTENT ── */}
        <main className="min-w-0">
          <FeedContent />

          {/* ── Mobile-only: Sidebar content below feed ── */}
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

        {/* ── RIGHT SIDEBAR (lg+ only) ── */}
        <FeedSidebar />
      </div>
    </div>
  );
}

function SidebarBlockSkeleton() {
  return (
    <div className="bg-card/50 ring-border/20 animate-pulse space-y-3 rounded-2xl p-4 ring-1">
      <div className="bg-muted h-4 w-28 rounded" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3 py-2">
          <div className="bg-muted h-9 w-9 flex-shrink-0 rounded-full" />
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
