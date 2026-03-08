import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export function PremiumBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500",
        className
      )}
    >
      <Crown className="h-3 w-3" />
      Premium
    </span>
  );
}
