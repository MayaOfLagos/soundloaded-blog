import { Skeleton } from "@/components/ui/skeleton";

export default function AlbumsLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
      <div className="grid grid-cols-1 gap-6 py-5 lg:grid-cols-[1fr_300px] xl:grid-cols-[220px_1fr_300px]">
        {/* Left sidebar placeholder */}
        <div className="hidden xl:block">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg" />
            ))}
          </div>
        </div>

        {/* Main content */}
        <main className="min-w-0">
          {/* Heading */}
          <div className="mb-5">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-72" />
          </div>

          {/* Albums grid skeleton */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="aspect-square w-full rounded-xl" />
                <div className="pt-2.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="mt-1 h-3 w-1/2" />
                  <Skeleton className="mt-1 h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Right sidebar placeholder */}
        <aside className="hidden lg:block">
          <div className="space-y-5">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-3 rounded-2xl p-4">
                <Skeleton className="h-4 w-28" />
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex gap-3 py-2">
                    <Skeleton className="h-14 w-14 flex-shrink-0 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
