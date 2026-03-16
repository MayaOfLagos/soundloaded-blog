"use client";

import { Headphones, Download, Heart } from "lucide-react";
import NumberFlow from "@number-flow/react";

interface TrackStatsBarProps {
  streamCount: number;
  downloadCount: number;
  favoriteCount: number;
}

function StatItem({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Headphones;
  value: number;
  label: string;
}) {
  return (
    <div className="text-muted-foreground flex items-center gap-1.5" title={label}>
      <Icon className="h-4 w-4" />
      <NumberFlow
        value={value}
        format={{ notation: value >= 10_000 ? "compact" : "standard" }}
        className="text-foreground text-sm font-semibold tabular-nums"
      />
    </div>
  );
}

export function TrackStatsBar({ streamCount, downloadCount, favoriteCount }: TrackStatsBarProps) {
  return (
    <div className="flex items-center gap-5">
      <StatItem icon={Headphones} value={streamCount} label="Streams" />
      <StatItem icon={Download} value={downloadCount} label="Downloads" />
      <StatItem icon={Heart} value={favoriteCount} label="Likes" />
    </div>
  );
}
