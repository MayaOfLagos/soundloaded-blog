"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface StoriesChartProps {
  data: { date: string; count: number }[];
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
          {entry.value} stories
        </p>
      ))}
    </div>
  );
}

export function StoriesChart({ data }: StoriesChartProps) {
  return (
    <div className="border-border bg-card rounded-xl border p-5">
      <h3 className="text-foreground mb-4 text-sm font-bold">Stories Created — Last 30 Days</h3>
      {data.length === 0 ? (
        <div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              className="text-muted-foreground"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => {
                const d = new Date(v);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
            />
            <YAxis
              className="text-muted-foreground"
              tick={{ fontSize: 11 }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="count"
              name="stories"
              stroke="#e11d48"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#e11d48" }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
