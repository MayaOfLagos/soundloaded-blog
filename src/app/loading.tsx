import { Skeleton } from "@/components/ui/skeleton";
import { FeedViewSkeleton } from "@/components/blog/FeedViewSkeleton";

function LeftSidebarSkeleton() {
  return (
    <div className="hidden xl:block">
      <div className="space-y-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function HeroSkeleton() {
  return <Skeleton className="aspect-video w-full rounded-3xl sm:aspect-21/9" />;
}

function SidebarBlockSkeleton() {
  return (
    <div className="bg-card/50 ring-border/20 rounded-2xl p-4 ring-1">
      <Skeleton className="mb-3 h-4 w-28" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3 py-2">
          <Skeleton className="h-14 w-14 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NewsletterSkeleton() {
  return (
    <div className="bg-card/50 ring-border/20 rounded-2xl p-4 ring-1">
      <Skeleton className="mb-2 h-4 w-32" />
      <Skeleton className="mb-1 h-3 w-full" />
      <Skeleton className="mb-4 h-3 w-3/4" />
      <Skeleton className="h-9 w-full rounded-full" />
    </div>
  );
}

export default function Loading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
      <div className="grid grid-cols-1 gap-6 py-5 lg:grid-cols-[1fr_300px] xl:grid-cols-[220px_1fr_300px]">
        <LeftSidebarSkeleton />

        <main className="min-w-0 space-y-6">
          <HeroSkeleton />
          <FeedViewSkeleton count={12} />
        </main>

        <aside className="hidden space-y-5 lg:block">
          <SidebarBlockSkeleton />
          <SidebarBlockSkeleton />
          <NewsletterSkeleton />
        </aside>
      </div>
    </div>
  );
}
