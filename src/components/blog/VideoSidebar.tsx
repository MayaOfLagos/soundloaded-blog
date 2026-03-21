"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  PlaySquare,
  Music,
  Newspaper,
  MessageCircle,
  Clock,
  Heart,
  History,
  FolderOpen,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
}

export const MAIN_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/videos", label: "Videos", icon: PlaySquare },
  { href: "/music", label: "Music", icon: Music },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/gist", label: "Gist", icon: MessageCircle },
];

export const LIBRARY_NAV: NavItem[] = [
  { href: "/favorites", label: "Liked", icon: Heart },
  { href: "/history", label: "History", icon: History },
  { href: "/watch-later", label: "Watch Later", icon: Clock },
];

export interface CategoryItem {
  name: string;
  slug: string;
  postCount: number;
}

interface VideoSidebarProps {
  mode: "full" | "mini" | "hidden";
  categories?: CategoryItem[];
}

export function VideoSidebar({ mode, categories = [] }: VideoSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  if (mode === "hidden") return null;

  // ━━━ Mini sidebar (72px, icons only) ━━━
  if (mode === "mini") {
    return (
      <aside className="border-border/40 bg-background fixed top-14 bottom-0 left-0 z-20 w-[72px] overflow-y-auto border-r">
        <nav className="flex flex-col items-center gap-1 py-2">
          {MAIN_NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex w-full flex-col items-center gap-0.5 rounded-lg px-1 py-3 transition-colors",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", active && "text-brand")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    );
  }

  // ━━━ Full sidebar (240px) ━━━
  return (
    <aside className="scrollbar-auto-hide border-border/40 bg-background fixed top-14 bottom-0 left-0 z-20 w-[240px] overflow-y-auto border-r pb-8">
      {/* Main nav */}
      <nav className="space-y-1 py-2">
        {MAIN_NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5 flex-shrink-0", active && "text-brand")} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-border/40 mx-3 my-2 border-t" />

      {/* Library */}
      <div className="px-3 pt-1 pb-1">
        <p className="text-muted-foreground mb-1 text-[11px] font-semibold tracking-wider uppercase">
          Library
        </p>
      </div>
      <nav className="space-y-0.5">
        {LIBRARY_NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-4.5 w-4.5 flex-shrink-0", active && "text-brand")} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Categories */}
      {categories.length > 0 && (
        <>
          <div className="border-border/40 mx-3 my-2 border-t" />
          <div className="px-3 pt-1 pb-1">
            <p className="text-muted-foreground mb-1 text-[11px] font-semibold tracking-wider uppercase">
              Categories
            </p>
          </div>
          <nav className="space-y-0.5">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/videos?category=${cat.slug}`}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <FolderOpen className="h-4 w-4 flex-shrink-0" />
                <span className="min-w-0 flex-1 truncate">{cat.name}</span>
                <span className="text-muted-foreground/60 text-[10px] font-semibold">
                  {cat.postCount}
                </span>
              </Link>
            ))}
          </nav>
        </>
      )}

      <div className="border-border/40 mx-3 my-3 border-t" />

      {/* Upload CTA */}
      <div className="px-3">
        <Link
          href="/admin/posts/new?type=VIDEO"
          className="bg-brand hover:bg-brand/90 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          <Upload className="h-4 w-4" />
          Upload Video
        </Link>
      </div>
    </aside>
  );
}
