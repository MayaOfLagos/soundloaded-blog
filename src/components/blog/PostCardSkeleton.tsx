import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PostCardSkeletonProps {
  variant?: "default" | "featured" | "compact";
  className?: string;
}

export function PostCardSkeleton({ variant = "default", className }: PostCardSkeletonProps) {
  if (variant === "compact") {
    return (
      <div className={cn("flex gap-3 py-3", className)}>
        <Skeleton className="h-16 w-20 flex-shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    );
  }

  if (variant === "featured") {
    return (
      <div className={cn("border-border overflow-hidden rounded-2xl border", className)}>
        <Skeleton className="aspect-[16/9] w-full sm:aspect-[16/10]" />
        <div className="space-y-3 p-4 sm:p-5">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <div className="flex items-center gap-3 pt-1">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="ml-auto h-3 w-16" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("border-border overflow-hidden rounded-xl border", className)}>
      <Skeleton className="aspect-[16/9] w-full" />
      <div className="space-y-2 p-3 sm:p-4">
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
