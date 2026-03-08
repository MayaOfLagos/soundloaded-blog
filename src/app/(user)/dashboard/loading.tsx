import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLeftSidebar } from "@/components/dashboard/DashboardLeftSidebar";

export default function DashboardLoading() {
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
          {/* Stats grid - 4 gradient cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {["bg-rose-500/20", "bg-blue-500/20", "bg-amber-500/20", "bg-pink-500/20"].map(
              (bg, i) => (
                <div key={i} className={`${bg} space-y-2 rounded-2xl p-5`}>
                  <Skeleton className="h-9 w-20 bg-white/20" />
                  <Skeleton className="h-4 w-24 bg-white/10" />
                </div>
              )
            )}
          </div>
          {/* Charts row */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="bg-card/50 ring-border/40 rounded-2xl p-5 ring-1 backdrop-blur-sm">
              <Skeleton className="mb-1 h-5 w-36" />
              <Skeleton className="mb-4 h-3 w-20" />
              <Skeleton className="h-[240px] w-full" />
            </div>
            <div className="bg-card/50 ring-border/40 rounded-2xl p-5 ring-1 backdrop-blur-sm">
              <Skeleton className="mb-1 h-5 w-36" />
              <Skeleton className="mb-4 h-3 w-28" />
              <Skeleton className="mx-auto h-[200px] w-[200px] rounded-full" />
            </div>
          </div>
          {/* 2-col grid */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="bg-card/50 ring-border/40 space-y-3 rounded-2xl p-4 ring-1 backdrop-blur-sm">
              <Skeleton className="h-5 w-32" />
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
            <div className="bg-card/50 ring-border/40 space-y-3 rounded-2xl p-4 ring-1 backdrop-blur-sm">
              <Skeleton className="h-5 w-32" />
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
