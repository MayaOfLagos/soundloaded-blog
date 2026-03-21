import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-20 text-center", className)}>
      <div className="bg-muted/50 mb-5 flex h-16 w-16 items-center justify-center rounded-2xl">
        <Icon className="text-muted-foreground h-8 w-8" />
      </div>
      <h3 className="text-foreground text-lg font-bold">{title}</h3>
      <p className="text-muted-foreground mt-1.5 max-w-xs text-sm leading-relaxed">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="bg-brand hover:bg-brand/90 mt-5 inline-flex items-center rounded-full px-5 py-2 text-sm font-semibold text-white transition-colors"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
