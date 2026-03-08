"use client";

import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Bell, Menu, LogOut, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useUnreadNotificationCount } from "@/hooks/useUserDashboard";
import { DashboardMobileNav } from "./DashboardMobileNav";
import { useState } from "react";
import Link from "next/link";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/library": "Library",
  "/downloads": "Downloads",
  "/bookmarks": "Bookmarks",
  "/favorites": "Favorites",
  "/comments": "Comments",
  "/billing": "Billing",
  "/notifications": "Notifications",
  "/settings": "Settings",
};

export function DashboardTopbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { data: unreadCount } = useUnreadNotificationCount();
  const [mobileOpen, setMobileOpen] = useState(false);

  const pageTitle = PAGE_TITLES[pathname] ?? "Dashboard";
  const firstName = session?.user?.name?.split(" ")[0] ?? "User";

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 border-border sticky top-0 z-40 flex h-14 items-center gap-4 border-b px-4 backdrop-blur md:px-6">
      {/* Mobile hamburger */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <DashboardMobileNav onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Page title */}
      <div className="flex-1">
        <h1 className="text-foreground text-lg font-bold">{pageTitle}</h1>
        <p className="text-muted-foreground hidden text-xs md:block">Hi, {firstName}</p>
      </div>

      {/* Notification bell */}
      <Link href="/notifications">
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {(unreadCount ?? 0) > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px]"
            >
              {unreadCount! > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </Link>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={session?.user?.image ?? undefined} />
              <AvatarFallback className="bg-brand/20 text-brand text-xs font-bold">
                {session?.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{session?.user?.name}</p>
            <p className="text-muted-foreground text-xs">{session?.user?.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Back to Blog
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-red-600 focus:text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
