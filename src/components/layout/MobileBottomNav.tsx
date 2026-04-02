"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Music, Rss, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/music", icon: Music, label: "Music" },
  { href: "/feed", icon: Rss, label: "Feed" },
  { href: "/explore", icon: Compass, label: "Explore" },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-background/95 supports-[backdrop-filter]:bg-background/80 border-border/20 fixed right-0 bottom-0 left-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
      <div className="flex items-center justify-between px-4 py-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-1 transition-colors",
                isActive ? "text-brand" : "text-muted-foreground"
              )}
            >
              <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 1.5} />
              <span className={cn("text-[10px]", isActive ? "font-bold" : "font-medium")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
