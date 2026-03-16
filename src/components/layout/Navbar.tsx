"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Heart, Bookmark, Library } from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { SearchBar } from "@/components/search/SearchBar";
import { UserMenu } from "./UserMenu";
import { MobileNav } from "./MobileNav";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/lib/utils";

const ALL_NAV_LINKS = [
  { href: "/", label: "Home", icon: Home, settingsKey: null },
  { href: "/explore", label: "Explore", icon: Compass, settingsKey: "enableExplore" as const },
  { href: "/favorites", label: "Favorites", icon: Heart, settingsKey: null },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark, settingsKey: null },
  { href: "/library", label: "Library", icon: Library, settingsKey: null },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: settings } = useSettings();

  const NAV_LINKS = ALL_NAV_LINKS.filter((item) => {
    if (!item.settingsKey) return true;
    return !settings || settings[item.settingsKey] !== false;
  });

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50 w-full backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
        {/* Mobile hamburger */}
        <MobileNav />

        {/* Logo */}
        <Logo
          logoLightUrl={settings?.logoLight}
          logoDarkUrl={settings?.logoDark}
          siteName={settings?.siteName}
        />

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
        </nav>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-2">
          <SearchBar />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
