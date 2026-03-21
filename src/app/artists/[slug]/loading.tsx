import { Skeleton } from "@/components/ui/skeleton";

export default function ArtistLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
      {/* Cover banner */}
      <Skeleton className="aspect-[2.5/1] rounded-t-2xl sm:aspect-[3/1]" />

      {/* Profile section */}
      <div className="relative -mt-12 px-2 sm:-mt-16 sm:px-4">
        <div className="flex items-end gap-4 sm:gap-5">
          {/* Profile pic */}
          <Skeleton className="ring-background h-24 w-24 flex-shrink-0 rounded-full ring-4 sm:h-32 sm:w-32" />

          {/* Name + meta */}
          <div className="min-w-0 flex-1 pb-1">
            <Skeleton className="h-8 w-48 rounded-lg sm:h-9 sm:w-64" />
            <div className="mt-2 flex items-center gap-3">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-14" />
            </div>
          </div>
        </div>

        {/* Action row */}
        <div className="mt-4 flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-20 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>

        {/* Bio preview */}
        <Skeleton className="mt-4 h-20 w-full rounded-xl" />
      </div>

      {/* Tab bar */}
      <div className="mt-6 flex justify-center py-3">
        <Skeleton className="h-10 w-80 rounded-full sm:w-96" />
      </div>

      {/* Content — popular tracks */}
      <div className="pt-6">
        <Skeleton className="mb-4 h-6 w-24" />
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-10 w-10 rounded" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-32 sm:w-48" />
                <Skeleton className="mt-1 h-3 w-20" />
              </div>
              <Skeleton className="hidden h-3 w-12 sm:block" />
            </div>
          ))}
        </div>

        {/* Albums shelf */}
        <div className="mt-8">
          <Skeleton className="mb-4 h-6 w-28" />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-[160px] flex-shrink-0 sm:w-[180px]">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="mt-2 h-4 w-24" />
                <Skeleton className="mt-1 h-3 w-16" />
              </div>
            ))}
          </div>
        </div>

        {/* Latest releases shelf */}
        <div className="mt-8">
          <Skeleton className="mb-4 h-6 w-32" />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-[150px] flex-shrink-0 sm:w-[170px]">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="mt-2 h-4 w-28" />
                <Skeleton className="mt-1 h-3 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
