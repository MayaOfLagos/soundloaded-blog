import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface VideoCardSkeletonProps {
  className?: string;
}

export function VideoCardSkeleton({ className }: VideoCardSkeletonProps) {
  return (
    <div className={cn("", className)}>
      {/* Thumbnail */}
      <Skeleton className="aspect-video w-full rounded-xl" />

      {/* Metadata — YouTube style */}
      <div className="mt-3 flex gap-3">
        {/* Avatar */}
        <Skeleton className="h-9 w-9 flex-shrink-0 rounded-full" />

        {/* Text column */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </div>
  );
}
