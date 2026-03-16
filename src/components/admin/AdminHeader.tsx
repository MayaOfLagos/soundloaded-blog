"use client";

import { usePathname } from "next/navigation";
import { Menu, Bell, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminMobileSidebar } from "./AdminMobileSidebar";
import type { AdminLogo } from "./AdminSidebar";
import { useAdminSidebar } from "./AdminSidebarContext";
import { AdminSearch } from "./AdminSearch";
import { AdminUserDropdown } from "./AdminUserDropdown";
import { useState } from "react";

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/posts": "Posts",
  "/admin/posts/new": "New Post",
  "/admin/music": "Music",
  "/admin/music/upload": "Upload Music",
  "/admin/artists": "Artists",
  "/admin/albums": "Albums",
  "/admin/categories": "Categories",
  "/admin/comments": "Comments",
  "/admin/media": "Media",
  "/admin/stories": "Stories",
  "/admin/newsletter": "Newsletter",
  "/admin/users": "Users",
  "/admin/reports": "Reports",
  "/admin/analytics": "Analytics",
  "/admin/settings": "Settings",
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const segments = pathname.split("/");
  const parentPath = segments.slice(0, 3).join("/");
  return PAGE_TITLES[parentPath] || "Admin";
}

export function AdminHeader({ logo }: { logo?: AdminLogo }) {
  const pathname = usePathname();
  const { toggle } = useAdminSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="border-border bg-background flex h-14 shrink-0 items-center gap-3 border-b px-4 md:rounded-t-xl">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>

        {/* Desktop sidebar trigger */}
        <Button variant="ghost" size="icon" className="hidden md:flex" onClick={toggle}>
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>

        {/* Page title */}
        <h1 className="text-lg font-semibold">{getPageTitle(pathname)}</h1>

        {/* Search bar — desktop only */}
        <div className="ml-auto">
          <AdminSearch />
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button variant="ghost" size="icon">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
          </Button>

          {/* User dropdown with smooth animation */}
          <AdminUserDropdown />
        </div>
      </header>

      {/* Mobile sidebar */}
      <AdminMobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} logo={logo} />
    </>
  );
}
