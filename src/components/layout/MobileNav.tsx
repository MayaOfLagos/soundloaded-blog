"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home,
  Music,
  Newspaper,
  MessageSquare,
  Disc3,
  Mic2,
  Menu,
  X,
  Instagram,
  Twitter,
  Youtube,
  Facebook,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/common/Logo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/music", label: "Music Downloads", icon: Music },
  { href: "/news", label: "Music News", icon: Newspaper },
  { href: "/gist", label: "Gist", icon: MessageSquare },
  { href: "/albums", label: "Albums", icon: Disc3 },
  { href: "/artists", label: "Artists", icon: Mic2 },
];

const SOCIAL_LINKS = [
  { href: "https://instagram.com/soundloadedng", label: "Instagram", icon: Instagram },
  { href: "https://twitter.com/soundloadedng", label: "Twitter/X", icon: Twitter },
  { href: "https://youtube.com/@soundloadedng", label: "YouTube", icon: Youtube },
  { href: "https://facebook.com/soundloadedng", label: "Facebook", icon: Facebook },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="bg-card border-border flex w-[300px] flex-col p-0">
        <SheetHeader className="border-border border-b px-5 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle asChild>
              <Logo />
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              className="-mr-1 h-8 w-8"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="text-muted-foreground mb-2 px-2 text-[10px] font-semibold tracking-widest uppercase">
            Browse
          </p>
          <ul className="space-y-0.5">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-brand/10 text-brand"
                        : "text-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 flex-shrink-0",
                        isActive ? "text-brand" : "text-muted-foreground"
                      )}
                    />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer area */}
        <div className="border-border space-y-4 border-t px-5 pt-4 pb-6">
          {/* Theme toggle */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Theme</span>
            <ThemeToggle />
          </div>

          <Separator />

          {/* Social links */}
          <div className="flex items-center gap-2">
            {SOCIAL_LINKS.map(({ href, label, icon: Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-muted-foreground hover:text-foreground hover:bg-muted flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>

          <p className="text-muted-foreground text-[11px]">Nigeria&apos;s #1 Music Blog</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
