import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLeftSidebar } from "@/components/dashboard/DashboardLeftSidebar";

export default function SettingsLoading() {
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
          {/* Tab bar skeleton */}
          <div className="bg-muted flex w-fit gap-1 rounded-full p-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-20 rounded-full" />
            ))}
          </div>
          {/* Active tab content skeleton */}
          <div className="bg-card/50 ring-border/40 space-y-4 rounded-2xl p-6 ring-1 backdrop-blur-sm">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-1 h-4 w-60" />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between py-3">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-5 w-9 rounded-full" />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
