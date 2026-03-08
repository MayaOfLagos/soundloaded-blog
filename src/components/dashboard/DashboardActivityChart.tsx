"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface DashboardActivityChartProps {
  data: { date: string; downloads: number }[];
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-card ring-border/40 rounded-lg px-3 py-2 shadow-lg ring-1 backdrop-blur-sm">
      <p className="text-foreground text-xs font-bold">{label}</p>
      <p className="text-brand text-sm font-black">
        {payload[0].value} download{payload[0].value !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

export function DashboardActivityChart({ data }: DashboardActivityChartProps) {
  return (
    <div className="bg-card/50 ring-border/40 rounded-2xl ring-1 backdrop-blur-sm">
      <div className="px-5 pt-5">
        <h2 className="text-foreground text-base font-bold">Download Activity</h2>
        <p className="text-muted-foreground text-xs">Last 30 days</p>
      </div>
      <div className="p-5">
        {data.length === 0 ? (
          <div className="text-muted-foreground flex h-[240px] items-center justify-center text-sm">
            No activity yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="downloadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e11d48" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="natural"
                dataKey="downloads"
                stroke="#e11d48"
                fill="url(#downloadGradient)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: "#e11d48", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
