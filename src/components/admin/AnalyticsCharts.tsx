"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ViewsDataPoint {
  date: string;
  views: number;
}

interface DownloadsDataPoint {
  name: string;
  artist: string;
  downloads: number;
}

interface AnalyticsChartsProps {
  viewsData: ViewsDataPoint[];
  downloadsData: DownloadsDataPoint[];
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border bg-card rounded-lg border px-3 py-2 shadow-md">
      <p className="text-muted-foreground mb-1 text-xs">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-foreground text-sm font-bold">
          {entry.value.toLocaleString()} {entry.name}
        </p>
      ))}
    </div>
  );
}

export function AnalyticsCharts({ viewsData, downloadsData }: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Views Line Chart */}
      <div className="border-border bg-card rounded-xl border p-5">
        <h3 className="text-foreground mb-4 text-sm font-bold">Page Views — Last 30 Days</h3>
        {viewsData.length === 0 ? (
          <div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
            No data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={viewsData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="views"
                name="views"
                stroke="#e11d48"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#e11d48" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Downloads Bar Chart */}
      <div className="border-border bg-card rounded-xl border p-5">
        <h3 className="text-foreground mb-4 text-sm font-bold">Top 5 Most Downloaded Tracks</h3>
        {downloadsData.length === 0 ? (
          <div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
            No data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={downloadsData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const item = downloadsData.find((d) => d.name === label);
                  return (
                    <div className="border-border bg-card rounded-lg border px-3 py-2 shadow-md">
                      <p className="text-foreground text-xs font-semibold">{label}</p>
                      {item && <p className="text-muted-foreground text-xs">{item.artist}</p>}
                      <p className="text-foreground mt-1 text-sm font-bold">
                        {(payload[0]?.value as number)?.toLocaleString()} downloads
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="downloads" name="downloads" fill="#e11d48" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
