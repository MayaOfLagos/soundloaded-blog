import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLeftSidebar } from "@/components/dashboard/DashboardLeftSidebar";

export default function LibraryLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
      <div className="grid grid-cols-1 gap-6 py-5 xl:grid-cols-[220px_1fr]">
        <DashboardLeftSidebar />
        <main className="min-w-0 space-y-6">
          {/* Page title */}
          <div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="mt-2 h-4 w-56" />
          </div>

          {/* Animated tab bar */}
          <div className="border-border bg-muted flex w-fit gap-1 rounded-full border p-1">
            <Skeleton className="h-9 w-20 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-22 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
          </div>

          {/* Filter bar: vertical tabs left + sort/view right */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-1 sm:flex-col sm:gap-0.5">
              <Skeleton className="h-9 w-14 rounded-lg" />
              <Skeleton className="h-9 w-16 rounded-lg" />
              <Skeleton className="h-9 w-14 rounded-lg" />
              <Skeleton className="h-9 w-14 rounded-lg" />
              <Skeleton className="h-9 w-16 rounded-lg" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-24 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-md" />
            </div>
          </div>

          {/* Content grid */}
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
                    <Skeleton className="h-5 w-20" />
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
