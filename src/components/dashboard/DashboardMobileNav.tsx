"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Library,
  MessageSquare,
  CreditCard,
  Bell,
  Settings,
  ExternalLink,
  Music,
  Disc3,
  Mic2,
  Users,
  Building2,
} from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const BASE_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/library", label: "Library", icon: Library },
];

const ARTIST_NAV = [
  { href: "/dashboard/music", label: "My Music", icon: Music },
  { href: "/dashboard/albums", label: "My Albums", icon: Disc3 },
  { href: "/dashboard/artist-profile", label: "Artist Profile", icon: Mic2 },
];

const LABEL_NAV = [
  { href: "/dashboard/label-artists", label: "My Artists", icon: Users },
  { href: "/dashboard/releases", label: "Releases", icon: Disc3 },
  { href: "/dashboard/label-profile", label: "Label Profile", icon: Building2 },
];

const COMMON_NAV = [
  { href: "/comments", label: "Comments", icon: MessageSquare },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface DashboardMobileNavProps {
  onClose: () => void;
}

export function DashboardMobileNav({ onClose }: DashboardMobileNavProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const user = session?.user as
    | {
        artistProfileId?: string | null;
        labelProfileId?: string | null;
      }
    | undefined;

  const navItems = useMemo(() => {
    const items = [...BASE_NAV];
    if (user?.artistProfileId) items.push(...ARTIST_NAV);
    else if (user?.labelProfileId) items.push(...LABEL_NAV);
    items.push(...COMMON_NAV);
    return items;
  }, [user?.artistProfileId, user?.labelProfileId]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-border border-b px-5 pt-5 pb-4">
        <Logo />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-brand/10 text-brand font-bold" : "text-foreground hover:bg-muted"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 flex-shrink-0",
                  isActive ? "text-brand" : "text-muted-foreground"
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-border border-t px-5 py-4">
        <Separator className="mb-3" />
        <Link
          href="/"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground flex items-center gap-3 text-sm font-medium"
        >
          <ExternalLink className="h-4 w-4" />
          Back to Blog
        </Link>
      </div>
    </div>
  );
}
