"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Rss, Compass } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Logo } from "@/components/common/Logo";
import { SearchBar } from "@/components/search/SearchBar";
import { NotificationBell } from "./NotificationBell";
import { UserMenu } from "./UserMenu";
import { MobileMenuDropdown } from "./MobileMenuDropdown";
import { useSettings } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ALL_NAV_LINKS = [
  { href: "/", label: "Home", icon: Home, settingsKey: null },
  { href: "/feed", label: "Feed", icon: Rss, settingsKey: "enableFeed" as const },
  { href: "/explore", label: "Explore", icon: Compass, settingsKey: "enableExplore" as const },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: settings } = useSettings();
  const { data: navigationPages } = useQuery({
    queryKey: ["pages-navigation"],
    queryFn: async () => {
      const res = await axios.get<{ header: Array<{ id: string; title: string; href: string }> }>(
        "/api/pages/navigation"
      );
      return res.data.header;
    },
    staleTime: 5 * 60 * 1000,
  });

  const NAV_LINKS = ALL_NAV_LINKS.filter((item) => {
    if (!item.settingsKey) return true;
    return !settings || settings[item.settingsKey] !== false;
  });

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50 w-full backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
        {/* Logo — skeleton while settings load to avoid fallback flash */}
        {settings === undefined ? (
          <div className="bg-muted h-8 w-32 animate-pulse rounded-md" />
        ) : (
          <Logo
            logoLightUrl={settings?.logoLight}
            logoDarkUrl={settings?.logoDark}
            siteName={settings?.siteName}
          />
        )}

        {/* Desktop nav */}
        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-all duration-200",
                  isActive
                    ? "bg-brand/10 text-brand font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60 font-semibold"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive && "text-brand")} />
                {label}
              </Link>
            );
          })}
          {(navigationPages ?? []).slice(0, 4).map((page) => {
            const isActive = pathname === page.href;
            return (
              <Link
                key={page.id}
                href={page.href}
                className={cn(
                  "relative flex items-center rounded-full px-4 py-2 text-sm transition-all duration-200",
                  isActive
                    ? "bg-brand/10 text-brand font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60 font-semibold"
                )}
              >
                {page.title}
              </Link>
            );
          })}
        </nav>

        {/* Mobile right actions */}
        <div className="ml-auto flex items-center gap-2 md:hidden">
          <Button
            variant="default"
            size="sm"
            className="bg-brand hover:bg-brand/90 h-8 rounded-full px-4 text-xs font-semibold text-white"
            asChild
          >
            <Link href="/subscribe">Subscribe</Link>
          </Button>
          <MobileMenuDropdown />
        </div>

        {/* Desktop right actions */}
        <div className="ml-auto hidden items-center gap-2 md:flex">
          <SearchBar />
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
