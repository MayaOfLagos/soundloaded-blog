"use client";

import { useEffect } from "react";

type AdFormat = "auto" | "rectangle" | "leaderboard" | "skyscraper" | "fluid";

interface AdSlotProps {
  slot: string;
  format?: AdFormat;
  className?: string;
  /** Width × height hint for dev placeholder, e.g. "728x90" */
  size?: string;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export function AdSlot({ slot, format = "auto", className = "", size }: AdSlotProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        // AdSense not loaded yet
      }
    }
  }, []);

  if (process.env.NODE_ENV !== "production") {
    return (
      <div
        className={`border-muted-foreground/20 bg-muted/10 text-muted-foreground/50 flex items-center justify-center rounded border-2 border-dashed text-xs select-none ${className}`}
        aria-hidden="true"
      >
        Ad · {slot}
        {size ? ` · ${size}` : ""}
      </div>
    );
  }

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={{ display: "block" }}
      data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}
