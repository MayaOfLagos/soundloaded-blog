"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home,
  Compass,
  Heart,
  Bookmark,
  Library,
  Tag,
  Menu,
  X,
  Instagram,
  Twitter,
  Youtube,
  Facebook,
  Music,
  Send,
  Phone,
  User,
  Download,
  Settings,
  Shield,
  LogOut,
  LogIn,
  UserPlus,
  icons,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/common/Logo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useSettings } from "@/hooks/useSettings";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { cn } from "@/lib/utils";

const MAIN_NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { href: "/library", label: "Library", icon: Library },
];

const SOCIAL_ICON_MAP: Record<string, typeof Instagram> = {
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  facebook: Facebook,
  tiktok: Music,
  telegram: Send,
  whatsapp: Phone,
};

const SOCIAL_URL_MAP: Record<string, (handle: string) => string> = {
  instagram: (h) => `https://instagram.com/${h}`,
  twitter: (h) => `https://twitter.com/${h}`,
  youtube: (h) => `https://youtube.com/@${h}`,
  facebook: (h) => `https://facebook.com/${h}`,
  tiktok: (h) => `https://tiktok.com/@${h}`,
  telegram: (h) => `https://t.me/${h}`,
  whatsapp: (h) => `https://wa.me/${h}`,
};

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

function toPascalCase(kebab: string): string {
  return kebab
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

function LucideIcon({ name, className }: { name: string; className?: string }) {
  const pascalName = toPascalCase(name);
  const IconComponent = icons[pascalName as keyof typeof icons];
  if (!IconComponent) return <Tag className={className} />;
  return <IconComponent className={className} />;
}

function NavSection({
  title,
  links,
  pathname,
  onClose,
}: {
  title: string;
  links: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
  pathname: string;
  onClose: () => void;
}) {
  return (
    <div>
      <p className="text-muted-foreground mb-2 px-2 text-[10px] font-semibold tracking-widest uppercase">
        {title}
      </p>
      <ul className="space-y-0.5">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand/10 text-brand font-bold"
                    : "text-foreground hover:bg-muted hover:text-foreground"
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
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "EDITOR"];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: settings } = useSettings();
  const { data: session, status } = useSession();
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await axios.get<{ categories: Category[] }>("/api/categories");
      return res.data.categories;
    },
    staleTime: 5 * 60 * 1000,
  });

  const browseLinks = (categoriesData ?? []).map((cat) => ({
    href: `/${cat.slug}`,
    label: cat.name,
    icon: ({ className }: { className?: string }) => (
      <LucideIcon name={cat.icon ?? "tag"} className={className} />
    ),
  }));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="bg-card border-border flex w-[300px] flex-col p-0">
        <SheetHeader className="border-border border-b px-5 pt-5 pb-4">
          <VisuallyHidden>
            <SheetTitle>Navigation menu</SheetTitle>
          </VisuallyHidden>
          <div className="flex items-center justify-between">
            <Logo
              logoLightUrl={settings?.logoLight}
              logoDarkUrl={settings?.logoDark}
              siteName={settings?.siteName}
            />
            <Button
              variant="ghost"
              size="icon"
              className="-mr-1 h-8 w-8"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        {/* Nav links */}
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          <NavSection
            title="Menu"
            links={MAIN_NAV}
            pathname={pathname}
            onClose={() => setOpen(false)}
          />
          <Separator />
          {browseLinks.length > 0 && (
            <NavSection
              title="Browse"
              links={browseLinks}
              pathname={pathname}
              onClose={() => setOpen(false)}
            />
          )}
        </nav>

        {/* Footer area */}
        <div className="border-border space-y-3 border-t px-5 pt-4 pb-6">
          {/* User section */}
          {status === "authenticated" && session?.user ? (
            <>
              <div className="flex items-center gap-3 py-1">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={session.user.image ?? undefined} />
                  <AvatarFallback className="bg-brand/20 text-brand text-sm font-bold">
                    {session.user.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-sm font-semibold">
                    {session.user.name ?? "User"}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">{session.user.email}</p>
                </div>
              </div>
              <Separator />
              <ul className="space-y-0.5">
                {[
                  { href: "/settings", label: "My Profile", icon: User },
                  { href: "/downloads", label: "My Downloads", icon: Download },
                  { href: "/settings", label: "Settings", icon: Settings },
                  ...(ADMIN_ROLES.includes((session.user as { role?: string }).role ?? "")
                    ? [{ href: "/admin", label: "Admin Panel", icon: Shield }]
                    : []),
                ].map(({ href, label, icon: Icon }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      className="text-foreground hover:bg-muted flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                    >
                      <Icon className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                      {label}
                    </Link>
                  </li>
                ))}
                <li>
                  <button
                    onClick={() => {
                      setOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="text-muted-foreground flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-red-500/10 hover:text-red-600"
                  >
                    <LogOut className="h-4 w-4 flex-shrink-0" />
                    Sign Out
                  </button>
                </li>
              </ul>
            </>
          ) : status === "unauthenticated" ? (
            <div className="flex gap-2">
              <Button variant="default" size="sm" className="flex-1 gap-1.5" asChild>
                <Link href="/login" onClick={() => setOpen(false)}>
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-1.5" asChild>
                <Link href="/register" onClick={() => setOpen(false)}>
                  <UserPlus className="h-4 w-4" />
                  Register
                </Link>
              </Button>
            </div>
          ) : null}

          <Separator />

          {/* Theme toggle */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Theme</span>
            <ThemeToggle />
          </div>

          <Separator />

          {/* Social links */}
          <div className="flex items-center gap-2" suppressHydrationWarning>
            {(["instagram", "twitter", "youtube", "facebook", "tiktok", "telegram"] as const)
              .filter((key) => settings?.[key])
              .map((key) => {
                const Icon = SOCIAL_ICON_MAP[key];
                const href = SOCIAL_URL_MAP[key](settings![key]);
                const label = key.charAt(0).toUpperCase() + key.slice(1);
                return (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
          </div>

          <p className="text-muted-foreground text-[11px]">
            {settings?.tagline || "Nigeria\u0027s #1 Music Blog"}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
