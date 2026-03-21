import { Skeleton } from "@/components/ui/skeleton";

export default function ArtistsLoading() {
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
            <Skeleton className="h-8 w-32" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>

          {/* Search + Sort */}
          <div className="mb-4 flex items-center gap-3">
            <Skeleton className="h-[42px] flex-1 rounded-xl" />
            <Skeleton className="h-[42px] w-36 rounded-xl" />
          </div>

          {/* Genre chips */}
          <div className="mb-4 flex gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-20 flex-shrink-0 rounded-full" />
            ))}
          </div>

          {/* Artist grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center rounded-2xl p-4">
                <Skeleton className="mb-3 h-28 w-28 rounded-full sm:h-32 sm:w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-1.5 h-3 w-16" />
                <Skeleton className="mt-1.5 h-3 w-20" />
                <Skeleton className="mt-2.5 h-7 w-full rounded-full" />
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
