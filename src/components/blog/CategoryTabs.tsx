"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Music, Newspaper, MessageSquare, Disc3, Mic2, Home } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "All", icon: Home },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/music", label: "Music", icon: Music },
  { href: "/gist", label: "Gist", icon: MessageSquare },
  { href: "/albums", label: "Albums", icon: Disc3 },
  { href: "/artists", label: "Artists", icon: Mic2 },
];

export function CategoryTabs() {
  const pathname = usePathname();

  return (
    <div className="border-border bg-background sticky top-14 z-40 border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <ScrollArea className="w-full">
          <div className="flex gap-1 py-2">
            {TABS.map(({ href, label, icon: Icon }) => {
              const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                    isActive
                      ? "bg-brand text-brand-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                  {label}
                </Link>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" className="h-0.5" />
        </ScrollArea>
      </div>
    </div>
  );
}
