"use client";

import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LogOut, Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/common/ThemeToggle";

const PAGE_TITLES: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/posts": "Posts",
  "/admin/posts/new": "New Post",
  "/admin/music": "Music",
  "/admin/music/upload": "Upload Music",
  "/admin/artists": "Artists",
  "/admin/albums": "Albums",
  "/admin/categories": "Categories",
  "/admin/comments": "Comments",
  "/admin/newsletter": "Newsletter",
  "/admin/analytics": "Analytics",
  "/admin/users": "Users",
  "/admin/settings": "Settings",
};

export function AdminTopbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const title = PAGE_TITLES[pathname] ?? "Admin";

  return (
    <header className="border-border bg-background/95 sticky top-0 z-40 flex h-14 items-center gap-4 border-b px-6 backdrop-blur">
      <h1 className="text-foreground flex-1 text-base font-semibold">{title}</h1>

      <div className="flex items-center gap-2">
        <ThemeToggle />

        <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Notifications">
          <Bell className="text-muted-foreground h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-2" aria-label="User menu">
              <Avatar className="h-6 w-6">
                <AvatarImage src={session?.user?.image ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {session?.user?.name?.charAt(0)?.toUpperCase() ?? "A"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:block">
                {session?.user?.name ?? "Admin"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              {session?.user?.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-brand cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
