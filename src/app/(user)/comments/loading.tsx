import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLeftSidebar } from "@/components/dashboard/DashboardLeftSidebar";

export default function CommentsLoading() {
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
          <Skeleton className="h-10 w-[320px]" />
          {/* Table rows */}
          <div className="bg-card/50 ring-border/40 space-y-3 rounded-2xl p-4 ring-1 backdrop-blur-sm">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-2">
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
