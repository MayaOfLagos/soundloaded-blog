"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Library,
  Download,
  Bookmark,
  Heart,
  MessageSquare,
  CreditCard,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/common/Logo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/library", label: "Library", icon: Library },
  { href: "/downloads", label: "Downloads", icon: Download },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/comments", label: "Comments", icon: MessageSquare },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "border-border bg-sidebar hidden h-screen flex-col border-r transition-all duration-200 md:flex",
          collapsed ? "w-16" : "w-56"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "border-sidebar-border flex items-center border-b p-4",
            collapsed && "justify-center"
          )}
        >
          {collapsed ? <Logo iconOnly /> : <Logo />}
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            const link = (
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              );
            }
            return <div key={href}>{link}</div>;
          })}
        </nav>

        {/* Footer */}
        <div className="border-sidebar-border space-y-1 border-t px-2 pt-3 pb-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/"
                className={cn(
                  "text-sidebar-foreground hover:bg-sidebar-accent flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  collapsed && "justify-center px-2"
                )}
              >
                <ExternalLink className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span>Back to Blog</span>}
              </Link>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Back to Blog</TooltipContent>}
          </Tooltip>

          <Separator className="bg-sidebar-border my-2" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "text-sidebar-foreground hover:bg-sidebar-accent w-full",
              collapsed ? "justify-center px-0" : "justify-start"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="mr-2 h-4 w-4" /> Collapse
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
