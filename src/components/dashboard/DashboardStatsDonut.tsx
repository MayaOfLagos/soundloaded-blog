"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface DashboardStatsDonutProps {
  downloads: number;
  comments: number;
  bookmarks: number;
  favorites: number;
}

const COLORS = ["#e11d48", "#3b82f6", "#f59e0b", "#ec4899"];

export function DashboardStatsDonut({
  downloads,
  comments,
  bookmarks,
  favorites,
}: DashboardStatsDonutProps) {
  const data = [
    { name: "Downloads", value: downloads, color: COLORS[0] },
    { name: "Comments", value: comments, color: COLORS[1] },
    { name: "Bookmarks", value: bookmarks, color: COLORS[2] },
    { name: "Favorites", value: favorites, color: COLORS[3] },
  ];

  const total = downloads + comments + bookmarks + favorites;
  const hasData = total > 0;

  return (
    <div className="bg-card/50 ring-border/40 rounded-2xl ring-1 backdrop-blur-sm">
      <div className="px-5 pt-5">
        <h2 className="text-foreground text-base font-bold">Activity Breakdown</h2>
        <p className="text-muted-foreground text-xs">Your content engagement</p>
      </div>
      <div className="p-5">
        {!hasData ? (
          <div className="text-muted-foreground flex h-[240px] items-center justify-center text-sm">
            No activity yet
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="relative">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-foreground text-2xl font-black">{total}</span>
                <span className="text-muted-foreground text-[10px]">Total</span>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2">
              {data.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground text-xs">{item.name}</span>
                  <span className="text-foreground ml-auto text-xs font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
