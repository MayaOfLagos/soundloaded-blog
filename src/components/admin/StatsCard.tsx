import type { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: number; // percentage change
  className?: string;
}

export function StatsCard({ title, value, subtitle, icon, trend, className }: StatsCardProps) {
  const isTrendPositive = trend !== undefined && trend >= 0;

  return (
    <div className={cn("border-border bg-card rounded-xl border p-5", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <p className="text-foreground mt-1 text-2xl font-black">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {subtitle && <p className="text-muted-foreground mt-0.5 text-xs">{subtitle}</p>}
        </div>
        <div className="bg-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
          {icon}
        </div>
      </div>

      {trend !== undefined && (
        <div
          className={cn(
            "mt-3 flex items-center gap-1 text-xs font-medium",
            isTrendPositive ? "text-green-500" : "text-brand"
          )}
        >
          {isTrendPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          <span>
            {isTrendPositive ? "+" : ""}
            {trend.toFixed(1)}% from last month
          </span>
        </div>
      )}
    </div>
  );
}
