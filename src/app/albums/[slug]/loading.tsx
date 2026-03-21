import { Skeleton } from "@/components/ui/skeleton";

export default function AlbumLoading() {
  return (
    <div className="mx-auto max-w-4xl pb-24">
      {/* Hero */}
      <div className="px-4 pt-8 pb-6 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
          <Skeleton className="aspect-square w-full flex-shrink-0 rounded-2xl sm:w-64" />
          <div className="flex flex-1 flex-col justify-end space-y-3">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-9 w-56 rounded-lg" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Skeleton className="h-10 w-28 rounded-full" />
              <Skeleton className="h-10 w-20 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Tracklist */}
      <div className="px-4 pt-2 sm:px-6">
        <Skeleton className="mb-3 h-6 w-24" />
        <div className="space-y-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
              <Skeleton className="h-8 w-8 rounded" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-40 sm:w-56" />
              </div>
              <Skeleton className="hidden h-3 w-10 sm:block" />
            </div>
          ))}
        </div>
      </div>

      {/* More by artist */}
      <div className="mt-10 px-4 sm:px-6">
        <Skeleton className="mb-4 h-6 w-36" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-[150px] flex-shrink-0 sm:w-[170px]">
              <Skeleton className="aspect-square rounded-xl" />
              <Skeleton className="mt-2 h-4 w-28" />
              <Skeleton className="mt-1 h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
