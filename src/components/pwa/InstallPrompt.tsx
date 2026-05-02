"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { PWAInstallElement } from "@khmyznikov/pwa-install";
// Side-effect import activates the global JSX declaration for <pwa-install>
import type { PWAInstallProps } from "@khmyznikov/pwa-install";
export type { PWAInstallProps };

const EXCLUDED = ["/admin", "/payload-admin", "/login", "/register"];

export function InstallPrompt() {
  const pathname = usePathname();
  const ref = useRef<PWAInstallElement>(null);

  const isExcluded = EXCLUDED.some((p) => pathname === p || pathname.startsWith(p + "/"));

  useEffect(() => {
    if (isExcluded) return;

    // Register the custom element client-side only
    import("@khmyznikov/pwa-install")
      .then(() => {
        // Wait one tick for connectedCallback (async) to finish platform detection
        setTimeout(() => {
          const el = ref.current;
          if (!el) return;

          el.useLocalStorage = true;

          const isMobile = window.matchMedia("(max-width: 767px)").matches;

          if (isMobile) {
            // Mobile → Chrome / Android bottom-sheet style.
            // Clear both Apple flags so the component renders the Chrome template
            // regardless of whether the device is actually iOS or Android.
            el.isAppleMobilePlatform = false;
            el.isAppleDesktopPlatform = false;
          } else {
            // Desktop → iOS / iPadOS 26+ style (native modal dialog look).
            // Override platform detection to force the polished Apple template.
            el.isAppleDesktopPlatform = true;
            el.isApple26Plus = true;
            el.isAndroid = false;
            el.isAndroidFallback = false;
            // Force the dialog visible (showDialog(true) bypasses isInstallAvailable check)
            el.showDialog(true);
          }
        }, 250);
      })
      .catch(() => {});
  }, [isExcluded]);

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
