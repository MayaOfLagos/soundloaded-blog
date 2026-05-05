"use client";

import { BarChart2, Mail, MousePointerClick, Users } from "lucide-react";

type ClicksByGroup = {
  platform?: string | null;
  device?: string | null;
  country?: string | null;
  variant?: string | null;
  _count?: { id?: number } | null;
}[];

type Props = {
  fanlink: { title: string; totalClicks: number; uniqueVisitors: number; abEnabled: boolean };
  clicksByPlatform: ClicksByGroup;
  clicksByDevice: ClicksByGroup;
  clicksByCountry: ClicksByGroup;
  clicksByVariant: ClicksByGroup;
  emailCount: number;
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div className="bg-card/60 ring-border/40 flex items-center gap-3 rounded-2xl p-4 ring-1 backdrop-blur-sm">
      <div className="bg-brand/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl">
        <Icon className="text-brand h-5 w-5" />
      </div>
      <div>
        <p className="text-foreground text-xl font-black">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p className="text-muted-foreground text-xs">{label}</p>
        {sub && <p className="text-muted-foreground/60 text-[10px]">{sub}</p>}
      </div>
    </div>
  );
}

function BarGroup({
  items,
  labelKey,
  title,
}: {
  items: ClicksByGroup;
  labelKey: "platform" | "device" | "country";
  title: string;
}) {
  const total = items.reduce((s, i) => s + (i._count?.id ?? 0), 0);
  if (total === 0) return null;

  return (
    <div className="bg-card/60 ring-border/40 space-y-3 rounded-2xl p-5 ring-1 backdrop-blur-sm">
      <h3 className="text-foreground text-sm font-bold">{title}</h3>
      <div className="space-y-2">
        {items.slice(0, 8).map((item, i) => {
          const label = item[labelKey] ?? "Unknown";
          const count = item._count?.id ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={`${label}-${i}`} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-foreground font-medium capitalize">{label}</span>
                <span className="text-muted-foreground">
                  {count.toLocaleString()} ({pct}%)
                </span>
              </div>
              <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                <div
                  className="bg-brand h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VariantComparison({ items }: { items: ClicksByGroup }) {
  const total = items.reduce((s, i) => s + (i._count?.id ?? 0), 0);
  if (total === 0) return null;

  const variantA = items.find((i) => i.variant === "A")?._count.id ?? 0;
  const variantB = items.find((i) => i.variant === "B")?._count.id ?? 0;
  const pctA = total > 0 ? Math.round((variantA / total) * 100) : 0;
  const pctB = total > 0 ? Math.round((variantB / total) * 100) : 0;

  return (
    <div className="bg-card/60 ring-border/40 space-y-4 rounded-2xl p-5 ring-1 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-foreground text-sm font-bold">A/B Test Results</h3>
        <span className="text-muted-foreground text-xs">
          {total.toLocaleString()} tracked visits
        </span>
      </div>

      <div className="space-y-3">
        {/* Variant A */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-foreground font-medium">Variant A (Original)</span>
            <span className="text-muted-foreground">
              {variantA.toLocaleString()} ({pctA}%)
            </span>
          </div>
          <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
            <div
              className="bg-brand h-full rounded-full transition-all duration-500"
              style={{ width: `${pctA}%` }}
            />
          </div>
        </div>

        {/* Variant B */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-foreground font-medium">Variant B (Test)</span>
            <span className="text-muted-foreground">
              {variantB.toLocaleString()} ({pctB}%)
            </span>
          </div>
          <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${pctB}%` }}
            />
          </div>
        </div>
      </div>

      {variantA > 0 && variantB > 0 && (
        <p className="text-muted-foreground text-xs">
          {variantB > variantA
            ? `Variant B is performing ${Math.round(((variantB - variantA) / variantA) * 100)}% better than A`
            : variantA > variantB
              ? `Variant A is performing ${Math.round(((variantA - variantB) / variantB) * 100)}% better than B`
              : "Both variants are performing equally"}
        </p>
      )}
    </div>
  );
}

export function FanlinkAnalytics({
  fanlink,
  clicksByPlatform,
  clicksByDevice,
  clicksByCountry,
  clicksByVariant,
  emailCount,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={MousePointerClick} label="Total Clicks" value={fanlink.totalClicks} />
        <StatCard icon={Users} label="Unique Visitors" value={fanlink.uniqueVisitors} />
        <StatCard icon={Mail} label="Emails Collected" value={emailCount} />
        <StatCard
          icon={BarChart2}
          label="Top Platform"
          value={
            (clicksByPlatform[0]?.["platform" as keyof (typeof clicksByPlatform)[0]] as string) ??
            "—"
          }
          sub={clicksByPlatform[0] ? `${clicksByPlatform[0]._count.id} clicks` : undefined}
        />
      </div>

      {/* A/B Test Results */}
      {fanlink.abEnabled && <VariantComparison items={clicksByVariant} />}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <BarGroup items={clicksByPlatform} labelKey="platform" title="Clicks by Platform" />
        <BarGroup items={clicksByDevice} labelKey="device" title="Clicks by Device" />
        <BarGroup items={clicksByCountry} labelKey="country" title="Top Countries" />
      </div>
    </div>
  );
}
