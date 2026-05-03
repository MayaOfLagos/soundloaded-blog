"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  releaseDate: string;
  isDark: boolean;
  accentColor: string;
};

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

function getTimeLeft(target: Date): TimeLeft {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  };
}

export function ReleaseDateCountdown({ releaseDate, isDark, accentColor }: Props) {
  const target = new Date(releaseDate);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(target));

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft(target)), 1000);
    return () => clearInterval(id);
  }, [releaseDate]); // eslint-disable-line react-hooks/exhaustive-deps

  if (timeLeft.expired) return null;

  const units = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Mins", value: timeLeft.minutes },
    { label: "Secs", value: timeLeft.seconds },
  ];

  return (
    <div
      className={cn(
        "mx-6 mb-4 space-y-2 rounded-xl p-4 text-center",
        isDark ? "border border-white/10 bg-white/5" : "border border-black/8 bg-black/3"
      )}
    >
      <p
        className={cn(
          "text-xs font-semibold tracking-widest uppercase",
          isDark ? "text-white/50" : "text-gray-500"
        )}
      >
        Dropping in
      </p>
      <div className="flex justify-center gap-3">
        {units.map(({ label, value }) => (
          <div key={label} className="flex min-w-[48px] flex-col items-center gap-0.5">
            <span className="text-2xl font-black tabular-nums" style={{ color: accentColor }}>
              {String(value).padStart(2, "0")}
            </span>
            <span
              className={cn(
                "text-[10px] font-medium tracking-wide uppercase",
                isDark ? "text-white/40" : "text-gray-400"
              )}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
