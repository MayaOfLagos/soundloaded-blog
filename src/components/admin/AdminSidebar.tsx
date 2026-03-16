"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  Music,
  Mic2,
  Disc3,
  Tags,
  MessageSquare,
  ImageIcon,
  Camera,
  Mail,
  Users,
  Flag,
  BarChart3,
  Settings,
  ExternalLink,
  LogOut,
  ChevronUp,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAdminSidebar } from "./AdminSidebarContext";
import Image from "next/image";

export type AdminLogo = {
  light: string | null;
  dark: string | null;
  favicon: string | null;
};

const mainNav = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Posts", href: "/admin/posts", icon: FileText },
  { title: "Music", href: "/admin/music", icon: Music },
  { title: "Artists", href: "/admin/artists", icon: Mic2 },
  { title: "Albums", href: "/admin/albums", icon: Disc3 },
];

const manageNav = [
  { title: "Categories", href: "/admin/categories", icon: Tags },
  { title: "Comments", href: "/admin/comments", icon: MessageSquare },
  { title: "Media", href: "/admin/media", icon: ImageIcon },
  { title: "Stories", href: "/admin/stories", icon: Camera },
  { title: "Newsletter", href: "/admin/newsletter", icon: Mail },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Reports", href: "/admin/reports", icon: Flag },
];

const bottomNav = [
  { title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { title: "Settings", href: "/admin/settings", icon: Settings },
];

function NavItem({
  item,
  pathname,
  collapsed,
  onClick,
}: {
  item: { title: string; href: string; icon: React.ComponentType<{ className?: string }> };
  pathname: string;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);

  const link = (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] font-medium transition-colors ${
        collapsed ? "justify-center px-0" : ""
      } ${
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
      }`}
    >
      <item.icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span>{item.title}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {item.title}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

export function AdminSidebar({ onNavigate, logo }: { onNavigate?: () => void; logo?: AdminLogo }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { collapsed } = useAdminSidebar();
  const user = session?.user;

  // Mobile sidebar is never collapsed
  const isCollapsed = onNavigate ? false : collapsed;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full flex-col overflow-hidden">
        {/* Brand */}
        <div
          className={`flex h-14 items-center gap-2 ${isCollapsed ? "justify-center px-2" : "px-4"}`}
        >
          {isCollapsed ? (
            // Collapsed: show favicon only
            logo?.favicon ? (
              <Image
                src={logo.favicon}
                alt="Soundloaded"
                width={28}
                height={28}
                className="shrink-0"
              />
            ) : null
          ) : (
            // Expanded: show full logo
            <>
              {logo?.light && logo?.dark ? (
                <>
                  <Image
                    src={logo.light}
                    alt="Soundloaded"
                    width={130}
                    height={28}
                    className="h-7 w-auto dark:hidden"
                  />
                  <Image
                    src={logo.dark}
                    alt="Soundloaded"
                    width={130}
                    height={28}
                    className="hidden h-7 w-auto dark:block"
                  />
                </>
              ) : logo?.light ? (
                <Image
                  src={logo.light}
                  alt="Soundloaded"
                  width={130}
                  height={28}
                  className="h-7 w-auto"
                />
              ) : logo?.dark ? (
                <Image
                  src={logo.dark}
                  alt="Soundloaded"
                  width={130}
                  height={28}
                  className="h-7 w-auto"
                />
              ) : null}
            </>
          )}
        </div>

        {/* Scrollable nav */}
        <ScrollArea className={`flex-1 py-4 ${isCollapsed ? "px-2" : "px-3"}`}>
          {/* Main */}
          <div className="space-y-1">
            {mainNav.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                pathname={pathname}
                collapsed={isCollapsed}
                onClick={onNavigate}
              />
            ))}
          </div>

          <Separator className="bg-sidebar-border my-4" />

          {/* Manage */}
          {!isCollapsed && (
            <p className="text-muted-foreground mb-2 px-3 text-xs font-semibold tracking-wider uppercase">
              Manage
            </p>
          )}
          <div className="space-y-1">
            {manageNav.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                pathname={pathname}
                collapsed={isCollapsed}
                onClick={onNavigate}
              />
            ))}
          </div>

          <Separator className="bg-sidebar-border my-4" />

          {/* Bottom nav */}
          <div className="space-y-1">
            {bottomNav.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                pathname={pathname}
                collapsed={isCollapsed}
                onClick={onNavigate}
              />
            ))}
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View Blog"
                    className="text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground flex items-center justify-center rounded-md py-2.5 transition-colors"
                  >
                    <ExternalLink className="h-5 w-5 shrink-0" />
                    <span className="sr-only">View Blog</span>
                  </a>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  View Blog
                </TooltipContent>
              </Tooltip>
            ) : (
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] font-medium transition-colors"
              >
                <ExternalLink className="h-5 w-5 shrink-0" />
                <span>View Blog</span>
              </a>
            )}
          </div>
        </ScrollArea>

        {/* User footer */}
        <div className="border-sidebar-border border-t p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`hover:bg-sidebar-accent/50 flex w-full items-center gap-3 rounded-md py-2 text-sm transition-colors ${
                  isCollapsed ? "justify-center px-0" : "px-2"
                }`}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={(user as { image?: string })?.image || ""} />
                  <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                    {user?.name?.charAt(0)?.toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <>
                    <div className="flex-1 text-left">
                      <p className="text-sidebar-foreground truncate font-medium">
                        {user?.name || "Admin"}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">{user?.email || ""}</p>
                    </div>
                    <ChevronUp className="text-muted-foreground h-4 w-4" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isCollapsed ? "center" : "end"} side="top" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/admin/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </TooltipProvider>
  );
}
