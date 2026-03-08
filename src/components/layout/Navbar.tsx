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

const NAV_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { href: "/library", label: "Library", icon: Library },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: settings } = useSettings();

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
