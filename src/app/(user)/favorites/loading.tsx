import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLeftSidebar } from "@/components/dashboard/DashboardLeftSidebar";

export default function FavoritesLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
      <div className="grid grid-cols-1 gap-6 py-5 xl:grid-cols-[220px_1fr]">
        <DashboardLeftSidebar />
        <main className="min-w-0 space-y-5">
          {/* Page title skeleton */}
          <div>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="mt-2 h-4 w-60" />
          </div>
          {/* Tabs skeleton */}
          <Skeleton className="h-10 w-64" />
          {/* Grid of 6 cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-card/50 ring-border/40 overflow-hidden rounded-2xl ring-1 backdrop-blur-sm"
              >
                <Skeleton className="h-[150px] w-full" />
                <div className="space-y-2 p-4">
                  <Skeleton className="h-5 w-3/4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-14" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
