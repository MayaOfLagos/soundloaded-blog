import { Skeleton } from "@/components/ui/skeleton";
import { VideoCardSkeleton } from "@/components/blog/VideoCardSkeleton";

/* Mini sidebar skeleton (72px) — matches YouTube mini sidebar */
function MiniSidebarSkeleton() {
  return (
    <aside className="border-border/40 bg-background fixed top-14 bottom-0 left-0 z-20 hidden w-[72px] border-r md:block">
      <div className="flex flex-col items-center gap-2 py-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1 px-1 py-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-2 w-8" />
          </div>
        ))}
      </div>
    </aside>
  );
}

/* ChipsBar skeleton */
function ChipsBarSkeleton() {
  return (
    <div className="border-border/40 border-b px-4 py-3 sm:px-6">
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 flex-shrink-0 rounded-full" />
        ))}
      </div>
    </div>
  );
}

export default function VideosLoading() {
  return (
    <div className="relative min-h-screen">
      {/* Mini sidebar skeleton */}
      <MiniSidebarSkeleton />

      {/* Main content */}
      <div className="ml-0 md:ml-[72px]">
        {/* Toggle + title row */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-1 sm:px-6">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-7 w-24" />
        </div>

        {/* Chips bar */}
        <ChipsBarSkeleton />

        {/* Content area */}
        <div className="px-4 py-4 sm:px-6">
          {/* Hero skeleton */}
          <section className="mb-8 max-w-4xl">
            <Skeleton className="aspect-video w-full rounded-3xl" />
          </section>

          {/* Subtitle skeleton */}
          <Skeleton className="mb-6 h-4 w-80" />

          {/* Video grid */}
          <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
