"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Library,
  MessageSquare,
  Bell,
  CreditCard,
  Settings,
  Home,
  LogOut,
  Music,
  Disc3,
  Mic2,
  Users,
  Building2,
  Sparkles,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { signOut } from "next-auth/react";

const BASE_NAV = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Library", href: "/library", icon: Library },
];

const ARTIST_NAV = [
  { label: "My Music", href: "/dashboard/music", icon: Music },
  { label: "My Albums", href: "/dashboard/albums", icon: Disc3 },
  { label: "Fanlinks", href: "/dashboard/fanlinks", icon: Link2 },
  { label: "Artist Profile", href: "/dashboard/artist-profile", icon: Mic2 },
];

const LABEL_NAV = [
  { label: "My Artists", href: "/dashboard/label-artists", icon: Users },
  { label: "Releases", href: "/dashboard/releases", icon: Disc3 },
  { label: "Label Profile", href: "/dashboard/label-profile", icon: Building2 },
];

const COMMON_NAV = [
  { label: "Comments", href: "/comments", icon: MessageSquare },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Billing", href: "/billing", icon: CreditCard },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function DashboardLeftSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const user = session?.user as
    | {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        artistProfileId?: string | null;
        labelProfileId?: string | null;
      }
    | undefined;

  const navItems = useMemo(() => {
    const items = [...BASE_NAV];

    if (user?.artistProfileId) {
      items.push(...ARTIST_NAV);
    } else if (user?.labelProfileId) {
      items.push(...LABEL_NAV);
    }

    items.push(...COMMON_NAV);
    return items;
  }, [user?.artistProfileId, user?.labelProfileId]);

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "U";

  const hasCreatorProfile = user?.artistProfileId || user?.labelProfileId;

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] flex-col xl:flex">
      {/* User card */}
      <div className="bg-card/50 ring-border/40 mb-4 rounded-2xl p-3.5 ring-1 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.image ?? undefined} />
            <AvatarFallback className="bg-brand/15 text-brand text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-sm font-bold">{user?.name ?? "User"}</p>
            <p className="text-muted-foreground truncate text-[11px]">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1">
        <p className="text-muted-foreground/60 mb-2 px-3 text-[10px] font-bold tracking-[0.2em] uppercase">
          Menu
        </p>
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                isActive
                  ? "bg-brand/10 text-brand font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                  isActive
                    ? "bg-brand/15 text-brand"
                    : "bg-muted text-muted-foreground group-hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              {label}
              {isActive && <span className="bg-brand ml-auto h-1.5 w-1.5 rounded-full" />}
            </Link>
          );
        })}

        {/* Apply CTA (only for users without creator profile) */}
        {!hasCreatorProfile && (
          <>
            <div className="border-border/40 my-3 border-t" />
            <Link
              href="/apply/artist"
              className="text-muted-foreground hover:bg-brand/10 hover:text-brand group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all"
            >
              <div className="bg-muted group-hover:bg-brand/15 group-hover:text-brand flex h-8 w-8 items-center justify-center rounded-lg transition-colors">
                <Sparkles className="h-4 w-4" />
              </div>
              Become a Creator
            </Link>
          </>
        )}
      </nav>

      {/* Bottom links */}
      <div className="border-border/40 flex-shrink-0 space-y-1 border-t pt-3">
        <Link
          href="/"
          className="text-muted-foreground hover:bg-muted hover:text-foreground group flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all"
        >
          <Home className="h-4 w-4" />
          Back to Home
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-muted-foreground flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all hover:bg-red-500/10 hover:text-red-500"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
