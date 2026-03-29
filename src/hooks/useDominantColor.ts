"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { FastAverageColor } from "fast-average-color";

const fac = new FastAverageColor();
const cache = new Map<string, string>();
const listeners = new Set<() => void>();
const FALLBACK = "30,30,30";

function notify() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function luminance(r: number, g: number, b: number) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function darken(r: number, g: number, b: number, factor = 0.45) {
  return `${Math.round(r * factor)},${Math.round(g * factor)},${Math.round(b * factor)}`;
}

function pickColor(img: HTMLImageElement): string {
  try {
    const dominant = fac.getColor(img, { algorithm: "dominant" });
    const [dr, dg, db] = dominant.value;
    if (luminance(dr, dg, db) < 0.55) return `${dr},${dg},${db}`;

    const square = fac.getColor(img, { algorithm: "sqrt" });
    const [sr, sg, sb] = square.value;
    if (luminance(sr, sg, sb) < 0.55) return `${sr},${sg},${sb}`;

    const simple = fac.getColor(img, { algorithm: "simple" });
    const [ar, ag, ab] = simple.value;
    if (luminance(ar, ag, ab) < 0.55) return `${ar},${ag},${ab}`;

    if (luminance(dr, dg, db) < 0.85) return darken(dr, dg, db, 0.4);
  } catch {
    /* canvas tainted or CORS blocked */
  }

  return FALLBACK;
}

function resolveColor(src: string) {
  // Route through Next.js image proxy to avoid CORS issues with R2/CDN
  const proxiedSrc = `/_next/image?url=${encodeURIComponent(src)}&w=64&q=50`;

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = proxiedSrc;

  img.onload = () => {
    const rgb = pickColor(img);
    cache.set(src, rgb);
    notify();
  };

  img.onerror = () => {
    cache.set(src, FALLBACK);
    notify();
  };
}

export function useDominantColor(src: string | null | undefined) {
  const getSnapshot = useCallback(() => (src ? (cache.get(src) ?? null) : null), [src]);
  const color = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (!src || cache.has(src)) return;
    resolveColor(src);
  }, [src]);

  return useMemo(() => color, [color]);
}
