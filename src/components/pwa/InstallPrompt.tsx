"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
// Importing this type activates the global JSX declaration for <pwa-install>
import type { PWAInstallProps } from "@khmyznikov/pwa-install";
import type { PWAInstallElement } from "@khmyznikov/pwa-install";

// Suppress unused-import lint warnings — both imports are needed for JSX & ref types
export type { PWAInstallProps };

const EXCLUDED = ["/admin", "/payload-admin", "/login", "/register"];

export function InstallPrompt() {
  const pathname = usePathname();
  const ref = useRef<PWAInstallElement>(null);

  const isExcluded = EXCLUDED.some((p) => pathname === p || pathname.startsWith(p + "/"));

  useEffect(() => {
    if (isExcluded) return;
    // Registers the <pwa-install> custom element client-side only (no SSR)
    import("@khmyznikov/pwa-install").catch(() => {});
  }, [isExcluded]);

  useEffect(() => {
    if (!ref.current) return;
    // useLocalStorage persists dismissed state across sessions
    ref.current.useLocalStorage = true;
  }, []);

  if (isExcluded) return null;

  return (
    <pwa-install
      ref={ref}
      manifest-url="/api/manifest"
      name="Soundloaded"
      description="The music platform for upcoming Naija artists"
      icon="/icons/icon-192x192.png"
    />
  );
}
