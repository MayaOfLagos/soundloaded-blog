import { Skeleton } from "@/components/ui/skeleton";

function SidebarSkeleton() {
  return (
    <aside className="hidden w-[220px] flex-shrink-0 xl:block">
      <div className="space-y-1 py-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-xl" />
        ))}
      </div>
      <div className="mx-3 my-2">
        <Skeleton className="h-px w-full" />
      </div>
      <div className="space-y-0.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-xl" />
        ))}
      </div>
    </aside>
  );
}

function ListItemSkeleton() {
  return (
    <div className="border-border/40 border-b px-3 py-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-14 w-14 flex-shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </div>
  );
}

function RightSidebarSkeleton() {
  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] space-y-5 overflow-y-auto pb-8 lg:block">
      <div className="bg-card/50 ring-border/20 animate-pulse space-y-3 rounded-2xl p-4 ring-1">
        <Skeleton className="h-4 w-28" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3 py-2">
            <Skeleton className="h-14 w-14 flex-shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-card/50 ring-border/20 animate-pulse space-y-3 rounded-2xl p-4 ring-1">
        <Skeleton className="h-4 w-24" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3 py-2">
            <Skeleton className="h-14 w-14 flex-shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default function LyricsLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
      <div className="grid grid-cols-1 gap-6 py-5 lg:grid-cols-[1fr_300px] xl:grid-cols-[220px_1fr_300px]">
        {/* Left sidebar skeleton */}
        <SidebarSkeleton />

        {/* Main content */}
        <main className="min-w-0">
          {/* Hero skeleton */}
          <Skeleton className="mb-6 aspect-[16/9] w-full rounded-3xl sm:aspect-[21/9]" />

          {/* Title skeleton */}
          <div className="mb-5">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="mt-2 h-4 w-80" />
          </div>

          {/* Two-column list skeleton */}
          <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <ListItemSkeleton key={i} />
            ))}
          </div>
        </main>

        {/* Right sidebar skeleton */}
        <RightSidebarSkeleton />
      </div>
    </div>
  );
}
