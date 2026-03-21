import { Skeleton } from "@/components/ui/skeleton";

export default function GistLoading() {
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
          {/* Hero skeleton */}
          <Skeleton className="mb-6 aspect-[16/9] w-full rounded-3xl sm:aspect-[21/9]" />

          {/* Heading */}
          <div className="mb-5">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="mt-2 h-4 w-80" />
          </div>

          {/* Masonry grid skeleton */}
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="mb-4 break-inside-avoid">
                <div className="overflow-hidden rounded-xl">
                  <Skeleton className="aspect-[16/9] w-full" />
                  <div className="space-y-2 p-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex items-center gap-2 pt-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="ml-auto h-3 w-16" />
                    </div>
                  </div>
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
