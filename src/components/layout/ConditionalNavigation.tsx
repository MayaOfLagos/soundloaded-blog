"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { MusicPlayer } from "@/components/music/MusicPlayer";
import { MobileBottomNav } from "./MobileBottomNav";

interface ConditionalNavigationProps {
  children: ReactNode;
}

// Routes that should NOT show the public Navbar/Footer
const EXCLUDE_PATHS = ["/admin", "/payload-admin", "/login", "/register"];

export function ConditionalNavigation({ children }: ConditionalNavigationProps) {
  const pathname = usePathname();
  const isExcluded = EXCLUDE_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (isExcluded) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {/* pb-24 on mobile = space for bottom nav bar (~68px). pb-20 on desktop = music player */}
      <main className="flex-1 pb-24 md:pb-20">{children}</main>
      <MusicPlayer />
      <MobileBottomNav />
      <Footer />
    </div>
  );
}
