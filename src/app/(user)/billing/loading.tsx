import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLeftSidebar } from "@/components/dashboard/DashboardLeftSidebar";

export default function BillingLoading() {
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
          {/* Current plan card */}
          <div className="bg-card/50 ring-border/40 space-y-3 rounded-2xl p-6 ring-1 backdrop-blur-sm">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-60" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          {/* Transaction history card */}
          <div className="bg-card/50 ring-border/40 space-y-3 rounded-2xl p-6 ring-1 backdrop-blur-sm">
            <Skeleton className="h-6 w-44" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
