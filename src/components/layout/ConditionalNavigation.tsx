"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Navbar } from "./Navbar";

import { MusicPlayer } from "@/components/music/MusicPlayer";
import { MobileBottomNav } from "./MobileBottomNav";
import { QueuePanel } from "@/components/music/QueuePanel";

interface ConditionalNavigationProps {
  children: ReactNode;
}

// Routes that should NOT show the public Navbar/Footer
const EXCLUDE_PATHS = ["/admin", "/payload-admin", "/login", "/register", "/landing"];

export function ConditionalNavigation({ children }: ConditionalNavigationProps) {
  const pathname = usePathname();

  // When on "/" without the sl_entered cookie the middleware serves the landing gate.
  // This check must be synchronous (not useEffect) to avoid a flash of the wrong layout
  // during client-side navigation — the root layout is frozen after the initial server render.
  const isOnLandingGate =
    pathname === "/" &&
    typeof document !== "undefined" &&
    !document.cookie.split(";").some((c) => c.trim().startsWith("sl_entered="));

  const isExcluded =
    EXCLUDE_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) || isOnLandingGate;

  if (isExcluded) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <MobileBottomNav />
      <MusicPlayer />
      <QueuePanel />
    </div>
  );
}
