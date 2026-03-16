import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type StatWidgetProps = {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: number | null;
  trendLabel?: string;
  subtitle?: string;
  href: string;
  iconClassName?: string;
};

export function StatWidget({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel = "from last month",
  subtitle,
  href,
  iconClassName = "bg-primary/10 text-primary dark:bg-primary/20",
}: StatWidgetProps) {
  const isPositive = trend != null && trend >= 0;
  const isNegative = trend != null && trend < 0;

  return (
    <div className="group border-border bg-card text-card-foreground flex flex-col overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-md">
      {/* Main content */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value.toLocaleString()}</p>

          {/* Trend or subtitle */}
          <div className="mt-2 flex items-center gap-1.5">
            {trend != null ? (
              <>
                <span
                  className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                    isPositive
                      ? "bg-success/10 text-success dark:bg-success/20"
                      : isNegative
                        ? "bg-destructive/10 text-destructive dark:bg-destructive/20"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isPositive ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : isNegative ? (
                    <ArrowDownRight className="h-3 w-3" />
                  ) : null}
                  {Math.abs(trend)}%
                </span>
                <span className="text-muted-foreground text-xs">{trendLabel}</span>
              </>
            ) : subtitle ? (
              <span className="text-muted-foreground text-xs">{subtitle}</span>
            ) : null}
          </div>
        </div>

        {/* Icon */}
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {/* Footer link */}
      <Link
        href={href}
        className="border-border bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground flex items-center justify-between border-t px-4 py-2.5 text-xs font-medium transition-colors"
      >
        <span>More info</span>
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
