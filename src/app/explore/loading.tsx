import { Skeleton } from "@/components/ui/skeleton";
import { ExploreCardSkeleton } from "@/components/explore/ExploreCardSkeleton";

function ExploreTabBarSkeleton() {
  return (
    <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-full" />
      ))}
    </div>
  );
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

export default function ExploreLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
      <div className="grid grid-cols-1 gap-6 py-5 lg:grid-cols-[1fr_300px] xl:grid-cols-[220px_1fr_300px]">
        <LeftSidebarSkeleton />

        <main className="min-w-0">
          <ExploreTabBarSkeleton />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ExploreCardSkeleton key={i} />
            ))}
          </div>
        </main>

        <aside className="hidden space-y-5 lg:block">
          <SidebarBlockSkeleton />
          <SidebarBlockSkeleton />
          <div className="bg-card/50 ring-border/20 rounded-2xl p-4 ring-1">
            <Skeleton className="mb-2 h-4 w-32" />
            <Skeleton className="mb-1 h-3 w-full" />
            <Skeleton className="mb-4 h-3 w-3/4" />
            <Skeleton className="h-9 w-full rounded-full" />
          </div>
        </aside>
      </div>
    </div>
  );
}
