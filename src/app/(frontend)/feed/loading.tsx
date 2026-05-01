import { Skeleton } from "@/components/ui/skeleton";

function StoryTraySkeleton() {
  return (
    <div className="mb-4 flex gap-2 overflow-hidden py-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="aspect-[9/16] h-40 shrink-0 rounded-xl sm:h-48" />
      ))}
    </div>
  );
}

function ComposerSkeleton() {
  return (
    <div className="bg-card/50 ring-border/40 mb-4 rounded-2xl ring-1">
      <div className="flex items-center gap-3 px-4 py-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
        <Skeleton className="h-10 flex-1 rounded-full" />
        <div className="flex gap-1">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function TabsSkeleton() {
  return (
    <div className="bg-card/50 ring-border/40 mb-4 flex items-center gap-1 rounded-xl p-1 ring-1">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-9 flex-1 rounded-lg" />
      ))}
    </div>
  );
}

function FeedPostSkeleton() {
  return (
    <div className="bg-card/40 ring-border/30 mb-4 overflow-hidden rounded-2xl ring-1">
      <div className="p-4">
        <div className="mb-3 flex items-center gap-2.5">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="flex items-center gap-4 px-4 py-3">
        <Skeleton className="h-7 w-16 rounded-full" />
        <Skeleton className="h-7 w-16 rounded-full" />
        <Skeleton className="ml-auto h-7 w-7 rounded-full" />
      </div>
    </div>
  );
}

function SidebarBlockSkeleton() {
  return (
    <div className="bg-card/50 ring-border/20 rounded-2xl p-4 ring-1">
      <Skeleton className="mb-3 h-4 w-28" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3 py-2">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function LeftSidebarSkeleton() {
  return (
    <div className="hidden xl:block">
      <div className="space-y-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function FeedLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
      <div className="grid grid-cols-1 gap-6 py-5 lg:grid-cols-[1fr_300px] xl:grid-cols-[220px_1fr_300px]">
        <LeftSidebarSkeleton />

        <main className="min-w-0">
          <div className="mx-auto w-full max-w-[680px]">
            <StoryTraySkeleton />
            <ComposerSkeleton />
            <TabsSkeleton />
            {Array.from({ length: 4 }).map((_, i) => (
              <FeedPostSkeleton key={i} />
            ))}
          </div>
        </main>

        <aside className="hidden space-y-5 lg:block">
          <SidebarBlockSkeleton />
          <SidebarBlockSkeleton />
        </aside>
      </div>
    </div>
  );
}
