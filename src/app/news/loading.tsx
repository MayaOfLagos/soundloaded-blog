import { Skeleton } from "@/components/ui/skeleton";

function LeftSidebarSkeleton() {
  return (
    <aside className="hidden space-y-4 xl:block">
      {/* Nav links */}
      <div className="space-y-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-lg" />
        ))}
      </div>
      {/* Categories */}
      <div className="space-y-2 pt-2">
        <Skeleton className="h-4 w-20" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded-lg" />
        ))}
      </div>
      {/* CTA */}
      <Skeleton className="h-10 w-full rounded-xl" />
    </aside>
  );
}

function HeroSkeleton() {
  return <Skeleton className="aspect-[16/9] w-full rounded-3xl sm:aspect-[21/9]" />;
}

function CardSkeleton() {
  return (
    <div className="ring-border/40 mb-4 break-inside-avoid overflow-hidden rounded-2xl ring-1">
      <Skeleton className="aspect-[16/9] w-full" />
      <div className="space-y-2 p-3.5 sm:p-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="hidden h-3 w-full sm:block" />
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="ml-auto h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

function RightSidebarSkeleton() {
  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] space-y-5 overflow-y-auto pb-8 lg:block">
      {/* Trending */}
      <div className="ring-border/40 rounded-2xl ring-1">
        <div className="border-border/50 flex items-center gap-2 border-b px-4 py-3">
          <Skeleton className="h-7 w-7 rounded-lg" />
          <Skeleton className="h-4 w-24" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3">
            <Skeleton className="h-8 w-8 flex-shrink-0 rounded-lg" />
            <Skeleton className="h-14 w-14 flex-shrink-0 rounded-xl" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-2 w-1/3" />
            </div>
          </div>
        ))}
      </div>
      {/* Popular */}
      <div className="ring-border/40 rounded-2xl ring-1">
        <div className="border-border/50 flex items-center gap-2 border-b px-4 py-3">
          <Skeleton className="h-7 w-7 rounded-lg" />
          <Skeleton className="h-4 w-28" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5">
            <Skeleton className="h-5 w-5 flex-shrink-0" />
            <Skeleton className="h-10 w-10 flex-shrink-0 rounded-lg" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-2.5 w-1/2" />
            </div>
          </div>
        ))}
      </div>
      {/* Newsletter */}
      <div className="ring-border/40 rounded-2xl p-4 ring-1">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-2 h-3 w-full" />
        <Skeleton className="mt-4 h-10 w-full rounded-lg" />
      </div>
    </aside>
  );
}

export default function NewsLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
      <div className="grid grid-cols-1 gap-6 py-5 lg:grid-cols-[1fr_300px] xl:grid-cols-[220px_1fr_300px]">
        {/* Left sidebar */}
        <LeftSidebarSkeleton />

        {/* Main content */}
        <main className="min-w-0">
          {/* Hero */}
          <section className="mb-6">
            <HeroSkeleton />
          </section>

          {/* Title */}
          <div className="mb-5">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="mt-2 h-4 w-72" />
          </div>

          {/* Masonry grid */}
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </main>

        {/* Right sidebar */}
        <RightSidebarSkeleton />
      </div>
    </div>
  );
}
