import { Skeleton } from "@/components/ui/skeleton";

export function StoryTraySkeleton() {
  return (
    <div className="scrollbar-hide flex gap-4 overflow-x-auto py-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-2.5 w-10 rounded" />
        </div>
      ))}
    </div>
  );
}
