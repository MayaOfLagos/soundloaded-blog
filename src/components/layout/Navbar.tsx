"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Music, Newspaper, MessageSquare, Disc3, Mic2 } from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { SearchDialog } from "@/components/common/SearchDialog";
import { MobileNav } from "./MobileNav";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/music", label: "Music", icon: Music },
  { href: "/gist", label: "Gist", icon: MessageSquare },
  { href: "/albums", label: "Albums", icon: Disc3 },
  { href: "/artists", label: "Artists", icon: Mic2 },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
        {/* Mobile hamburger */}
        <MobileNav />

        {/* Logo */}
        <Logo />

        {/* Desktop nav */}
        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "text-brand"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {label}
                {isActive && (
                  <span className="bg-brand absolute right-3 bottom-0 left-3 h-0.5 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-1">
          <SearchDialog />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
