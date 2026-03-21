import { Skeleton } from "@/components/ui/skeleton";

export default function AuthorPageLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      {/* Profile header skeleton */}
      <div className="bg-card/50 ring-border/40 overflow-hidden rounded-2xl ring-1">
        {/* Banner */}
        <div className="skeleton-shimmer h-28 sm:h-36" />
        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end">
            <Skeleton className="h-24 w-24 rounded-full sm:h-28 sm:w-28" />
            <div className="flex-1 space-y-2 sm:pb-1">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <Skeleton className="mt-4 h-4 w-full max-w-md" />
          <div className="mt-4 flex gap-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>

      {/* Posts section skeleton */}
      <div className="mt-8">
        <Skeleton className="mb-5 h-6 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-video w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
