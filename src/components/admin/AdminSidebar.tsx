"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Music,
  Users,
  Disc3,
  Mic2,
  Tag,
  MessageSquare,
  Mail,
  BarChart3,
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
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/posts", label: "Posts", icon: FileText },
  { href: "/admin/music", label: "Music", icon: Music },
  { href: "/admin/artists", label: "Artists", icon: Mic2 },
  { href: "/admin/albums", label: "Albums", icon: Disc3 },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/comments", label: "Comments", icon: MessageSquare },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "border-border bg-sidebar flex h-screen flex-col border-r transition-all duration-200",
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
            const isActive =
              pathname === href || (href !== "/admin/dashboard" && pathname.startsWith(href));
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
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "text-sidebar-foreground hover:bg-sidebar-accent flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  collapsed && "justify-center px-2"
                )}
              >
                <ExternalLink className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span>View Blog</span>}
              </a>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">View Blog</TooltipContent>}
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
