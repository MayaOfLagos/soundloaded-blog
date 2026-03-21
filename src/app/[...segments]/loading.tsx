import { Skeleton } from "@/components/ui/skeleton";

function LeftSidebarSkeleton() {
  return (
    <aside className="hidden space-y-5 lg:block">
      {/* Gist Chart */}
      <div className="ring-border/40 rounded-2xl ring-1">
        <div className="border-border/50 flex items-center gap-2 border-b px-4 py-3">
          <Skeleton className="h-7 w-7 rounded-lg" />
          <Skeleton className="h-4 w-20" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3">
            <Skeleton className="h-6 w-6 flex-shrink-0 rounded-md" />
            <Skeleton className="h-12 w-12 flex-shrink-0 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-2 w-1/3" />
            </div>
          </div>
        ))}
      </div>

      {/* Hot Gist */}
      <div className="ring-border/40 rounded-2xl ring-1">
        <div className="border-border/50 flex items-center gap-2 border-b px-4 py-3">
          <Skeleton className="h-7 w-7 rounded-lg" />
          <Skeleton className="h-4 w-16" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3">
            <Skeleton className="h-12 w-12 flex-shrink-0 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2 w-1/4" />
            </div>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div className="ring-border/40 rounded-2xl ring-1">
        <div className="border-border/50 flex items-center gap-2 border-b px-4 py-3">
          <Skeleton className="h-7 w-7 rounded-lg" />
          <Skeleton className="h-4 w-20" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-2.5">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-4 w-8 rounded-full" />
          </div>
        ))}
      </div>
    </aside>
  );
}

function RightSidebarSkeleton() {
  return (
    <aside className="hidden space-y-5 lg:block">
      <div className="ring-border/40 space-y-3 rounded-2xl p-4 ring-1">
        <Skeleton className="h-5 w-24" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3 py-2">
            <Skeleton className="h-12 w-16 flex-shrink-0 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
      <div className="ring-border/40 rounded-2xl p-4 ring-1">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-1 h-4 w-3/4" />
        <Skeleton className="mt-4 h-10 w-full rounded-lg" />
      </div>
    </aside>
  );
}

export default function PostDetailLoading() {
  return (
    <div className="mx-auto max-w-[1320px] px-4 py-6 sm:px-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr_300px]">
        {/* Left sidebar */}
        <LeftSidebarSkeleton />

        {/* Main content */}
        <div className="min-w-0">
          {/* Breadcrumb */}
          <div className="mb-4 flex items-center gap-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-3" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-3" />
            <Skeleton className="h-4 w-40" />
          </div>

          {/* Category badge */}
          <Skeleton className="mb-3 h-5 w-20 rounded-full" />

          {/* Title */}
          <Skeleton className="h-9 w-full" />
          <Skeleton className="mt-2 h-9 w-3/4" />

          {/* Excerpt */}
          <Skeleton className="mt-3 h-5 w-full" />
          <Skeleton className="mt-1 h-5 w-2/3" />

          {/* Share buttons */}
          <div className="mt-4 flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-9 rounded-full" />
            ))}
          </div>

          {/* Cover image */}
          <Skeleton className="mt-6 aspect-[16/9] w-full rounded-xl" />

          {/* Author + date row */}
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>

          {/* Article body */}
          <div className="mt-8 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="mt-2 h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-2 h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>

          {/* Share buttons bottom */}
          <div className="border-border mt-8 border-t pt-6">
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-9 rounded-full" />
              ))}
            </div>
          </div>

          {/* More Gist — 3 column grid skeleton */}
          <div className="mt-12">
            <Skeleton className="mb-4 h-6 w-28" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl">
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
              ))}
            </div>
          </div>

          {/* Related Contents — list skeleton */}
          <div className="mt-10">
            <Skeleton className="mb-2 h-5 w-36" />
            <div className="border-border divide-border divide-y border-t">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3 py-3">
                  <Skeleton className="h-16 w-20 flex-shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <RightSidebarSkeleton />
      </div>
    </div>
  );
}
