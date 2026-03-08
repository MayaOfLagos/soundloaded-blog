import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface VideoCardSkeletonProps {
  className?: string;
}

export function VideoCardSkeleton({ className }: VideoCardSkeletonProps) {
  return (
    <div className={cn("border-border overflow-hidden rounded-2xl border", className)}>
      {/* Video thumbnail — 16:9 with play indicator */}
      <div className="relative aspect-video">
        <Skeleton className="h-full w-full" />
        {/* Fake play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-muted h-12 w-12 rounded-full" />
        </div>
        {/* Fake video badge */}
        <div className="absolute top-2.5 left-2.5">
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        {/* Fake duration */}
        <div className="absolute right-2 bottom-2">
          <Skeleton className="h-4 w-10 rounded" />
        </div>
      </div>
      {/* Info */}
      <div className="space-y-2 p-3.5 sm:p-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="ml-auto h-3 w-16" />
        </div>
      </div>
    </div>
  );
}
