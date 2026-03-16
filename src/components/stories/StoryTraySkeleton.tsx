import { Skeleton } from "@/components/ui/skeleton";

export function StoryTraySkeleton() {
  return (
    <div className="scrollbar-hide flex gap-2 overflow-x-auto py-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="story-create-card flex-shrink-0 rounded-xl" />
      ))}
    </div>
  );
}
