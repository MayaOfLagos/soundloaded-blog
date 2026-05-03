"use client";

import { BarChart2, Mail, MousePointerClick, Users } from "lucide-react";

type ClicksByGroup = {
  platform?: string | null;
  device?: string | null;
  country?: string | null;
  _count: { id: number };
}[];

type Props = {
  fanlink: { title: string; totalClicks: number; uniqueVisitors: number };
  clicksByPlatform: ClicksByGroup;
  clicksByDevice: ClicksByGroup;
  clicksByCountry: ClicksByGroup;
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
  const total = items.reduce((s, i) => s + i._count.id, 0);
  if (total === 0) return null;

  return (
    <div className="bg-card/60 ring-border/40 space-y-3 rounded-2xl p-5 ring-1 backdrop-blur-sm">
      <h3 className="text-foreground text-sm font-bold">{title}</h3>
      <div className="space-y-2">
        {items.slice(0, 8).map((item, i) => {
          const label = item[labelKey] ?? "Unknown";
          const count = item._count.id;
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

export function FanlinkAnalytics({
  fanlink,
  clicksByPlatform,
  clicksByDevice,
  clicksByCountry,
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

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <BarGroup items={clicksByPlatform} labelKey="platform" title="Clicks by Platform" />
        <BarGroup items={clicksByDevice} labelKey="device" title="Clicks by Device" />
        <BarGroup items={clicksByCountry} labelKey="country" title="Top Countries" />
      </div>
    </div>
  );
}
