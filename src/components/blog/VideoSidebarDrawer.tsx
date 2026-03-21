"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, FolderOpen, Upload } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useUIStore } from "@/store/ui.store";
import { cn } from "@/lib/utils";
import { MAIN_NAV, LIBRARY_NAV, type CategoryItem } from "./VideoSidebar";

interface VideoSidebarDrawerProps {
  categories?: CategoryItem[];
}

export function VideoSidebarDrawer({ categories = [] }: VideoSidebarDrawerProps) {
  const pathname = usePathname();
  const open = useUIStore((s) => s.videoSidebarDrawerOpen);
  const close = useUIStore((s) => s.closeVideoSidebarDrawer);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && close()}>
      <SheetContent side="left" className="w-[280px] p-0">
        {/* Header */}
        <div className="border-border/40 flex items-center justify-between border-b px-4 py-3">
          <span className="text-foreground text-lg font-bold">Soundloaded</span>
          <button
            type="button"
            onClick={close}
            className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="scrollbar-auto-hide h-[calc(100vh-57px)] overflow-y-auto pb-8">
          {/* Main nav */}
          <nav className="space-y-1 py-2">
            {MAIN_NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
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

          <div className="border-border/40 mx-4 my-2 border-t" />

          {/* Library */}
          <div className="px-4 pt-1 pb-1">
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
                  onClick={close}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
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
              <div className="border-border/40 mx-4 my-2 border-t" />
              <div className="px-4 pt-1 pb-1">
                <p className="text-muted-foreground mb-1 text-[11px] font-semibold tracking-wider uppercase">
                  Categories
                </p>
              </div>
              <nav className="space-y-0.5">
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/videos?category=${cat.slug}`}
                    onClick={close}
                    className="text-muted-foreground hover:bg-muted/50 hover:text-foreground flex items-center gap-3 rounded-xl px-4 py-2 text-sm font-medium transition-colors"
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

          <div className="border-border/40 mx-4 my-3 border-t" />

          {/* Upload CTA */}
          <div className="px-4">
            <Link
              href="/admin/posts/new?type=VIDEO"
              onClick={close}
              className="bg-brand hover:bg-brand/90 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              <Upload className="h-4 w-4" />
              Upload Video
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
