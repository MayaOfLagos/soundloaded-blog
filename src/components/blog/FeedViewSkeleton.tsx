import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function SpotifyCardSkeleton() {
  return (
    <div className="bg-card/40 rounded-xl p-2.5 sm:p-3">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <div className="mt-2.5 space-y-1.5 px-0.5">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="mt-1 h-2.5 w-1/3" />
      </div>
    </div>
  );
}

function ListCardSkeleton() {
  return (
    <div className="border-border/30 bg-card/30 flex overflow-hidden rounded-2xl border">
      <Skeleton className="aspect-square w-28 shrink-0 rounded-none sm:w-32" />
      <div className="flex flex-1 flex-col justify-center gap-2 px-3.5 py-3 sm:px-4">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-2.5 w-24" />
      </div>
    </div>
  );
}

interface FeedViewSkeletonProps {
  /** Number of card skeletons to render */
  count?: number;
  /** Which card layout to mimic — defaults to grid */
  view?: "grid" | "list";
  className?: string;
}

export function FeedViewSkeleton({ count = 12, view = "grid", className }: FeedViewSkeletonProps) {
  return (
    <div className={className}>
      {/* Header row: morphing title + tab toggle + view-all */}
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-6 w-36 rounded-full" />
        <div className="flex items-center gap-2">
          {/* Tab toggle pill */}
          <div className="border-border/50 bg-muted/60 flex items-center gap-0.5 rounded-full border p-0.5">
            <Skeleton className="h-6 w-14 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
          {/* View all */}
          <Skeleton className="h-7 w-16 rounded-full" />
        </div>
      </div>

      {/* Card grid */}
      {view === "grid" ? (
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 sm:gap-2 lg:grid-cols-4">
          {Array.from({ length: count }).map((_, i) => (
            <SpotifyCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2")}>
          {Array.from({ length: count }).map((_, i) => (
            <ListCardSkeleton key={i} />
          ))}
        </div>
      )}
    </div>
  );
}
