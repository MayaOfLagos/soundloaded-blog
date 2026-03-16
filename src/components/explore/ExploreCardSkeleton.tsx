import { Skeleton } from "@/components/ui/skeleton";

export function ExploreCardSkeleton() {
  return (
    <div className="bg-card/50 ring-border/40 overflow-hidden rounded-2xl ring-1 backdrop-blur-sm">
      <div className="relative">
        <Skeleton className="aspect-[3/4] w-full" />

        {/* Right-side floating buttons (bigger) */}
        <div className="absolute top-3 right-3 bottom-3 flex flex-col items-center justify-end gap-1.5">
          <Skeleton className="mb-2 h-12 w-12 rounded-full" />
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-3 w-6 rounded" />
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-3 w-6 rounded" />
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-3 w-6 rounded" />
          <Skeleton className="h-11 w-11 rounded-full" />
        </div>

        {/* Bottom-left overlay content */}
        <div className="absolute right-20 bottom-0 left-0 space-y-3 p-4">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-8 w-8 rounded-full bg-white/10" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-24 bg-white/10" />
              <Skeleton className="h-2.5 w-16 bg-white/10" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full bg-white/10" />
            <Skeleton className="h-5 w-14 rounded-full bg-white/10" />
          </div>
          <Skeleton className="h-6 w-4/5 bg-white/10" />
          <Skeleton className="h-4 w-full bg-white/10" />
          <Skeleton className="h-4 w-2/3 bg-white/10" />
        </div>
      </div>
    </div>
  );
}
