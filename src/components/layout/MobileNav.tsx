"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import { Home, Compass, Rss, Tag, Menu, X, Upload, FileText, icons } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/Logo";
import { SOCIAL_ICON_MAP } from "@/components/common/SocialIcons";
import { useSettings } from "@/hooks/useSettings";
import { useIsMounted } from "@/hooks/useIsMounted";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { cn } from "@/lib/utils";

/* ── Constants ── */

const ALL_NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home, settingsKey: null },
  { href: "/feed", label: "Feed", icon: Rss, settingsKey: "enableFeed" as const },
  { href: "/explore", label: "Explore", icon: Compass, settingsKey: "enableExplore" as const },
];

const TRENDING_TAGS = [
  "Afrobeats",
  "Amapiano",
  "Gospel",
  "Hip Hop",
  "R&B",
  "Fuji",
  "Highlife",
  "New Release",
  "Freestyle",
  "Mixtape",
];

const SOCIAL_URL_MAP: Record<string, (handle: string) => string> = {
  instagram: (h) => `https://instagram.com/${h}`,
  twitter: (h) => `https://twitter.com/${h}`,
  youtube: (h) => `https://youtube.com/@${h}`,
  facebook: (h) => `https://facebook.com/${h}`,
  tiktok: (h) => `https://tiktok.com/@${h}`,
  telegram: (h) => `https://t.me/${h}`,
  whatsapp: (h) => `https://wa.me/${h}`,
};

const SLUG_TO_TOGGLE: Record<string, string> = {
  news: "enableNews",
  gist: "enableGist",
  lyrics: "enableLyrics",
  videos: "enableVideos",
  music: "enableMusic",
  albums: "enableAlbums",
  artists: "enableArtists",
};

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

interface NavigationPages {
  header: Array<{ id: string; title: string; href: string }>;
  footer: Array<{ id: string; title: string; href: string; systemKey: string | null }>;
}

/* ── Helpers ── */

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

/* ── Sub-components ── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground/60 mb-2 px-1 text-[10px] font-bold tracking-[0.2em] uppercase">
      {children}
    </p>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  isActive,
  onClose,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onClose: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
        isActive ? "bg-brand/10 text-brand font-bold" : "text-foreground hover:bg-muted"
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
        <Icon className="h-[16px] w-[16px]" />
      </div>
      {label}
      {isActive && <span className="bg-brand ml-auto h-1.5 w-1.5 rounded-full" />}
    </Link>
  );
}

/* ── Stagger wrapper ── */

function StaggerSection({
  children,
  index,
  className,
}: {
  children: React.ReactNode;
  index: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 + index * 0.04, duration: 0.3, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Main Component ── */

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: settings } = useSettings();
  const mounted = useIsMounted();

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await axios.get<{ categories: Category[] }>("/api/categories");
      return res.data.categories;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: navigationPages } = useQuery({
    queryKey: ["pages-navigation"],
    queryFn: async () => {
      const res = await axios.get<NavigationPages>("/api/pages/navigation");
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const close = () => setOpen(false);

  // Filter nav items by feature toggles
  const navItems = ALL_NAV_ITEMS.filter((item) => {
    if (!item.settingsKey) return true;
    return !settings || settings[item.settingsKey] !== false;
  });

  // Filter categories by feature toggles
  const categories = (categoriesData ?? []).filter((cat) => {
    const toggleKey = SLUG_TO_TOGGLE[cat.slug];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (toggleKey && settings && !(settings as any)[toggleKey]) return false;
    return true;
  });
  const headerPages = navigationPages?.header ?? [];
  const footerPages =
    navigationPages?.footer && navigationPages.footer.length > 0
      ? navigationPages.footer
      : [
          { id: "about", title: "About", href: "/about", systemKey: "about" },
          { id: "contact", title: "Contact", href: "/contact", systemKey: "contact" },
          { id: "privacy", title: "Privacy", href: "/privacy", systemKey: "privacy" },
          { id: "terms", title: "Terms", href: "/terms", systemKey: "terms" },
        ];

  // Social links
  const socialLinks =
    mounted && settings
      ? (["instagram", "twitter", "youtube", "facebook", "tiktok", "telegram"] as const)
          .filter((key) => settings[key])
          .map((key) => ({
            key,
            href: SOCIAL_URL_MAP[key](settings[key]),
            icon: SOCIAL_ICON_MAP[key],
            label: key.charAt(0).toUpperCase() + key.slice(1),
          }))
      : [];

  const copyrightName =
    settings?.copyrightText?.replace(". All rights reserved.", "") || "Soundloaded Nigeria";

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

      <SheetContent
        side="left"
        hideCloseButton
        className={cn(
          // Override default Sheet positioning for detached look
          "!inset-y-auto !h-auto !w-[calc(100vw-1.5rem)] !max-w-[320px] !border-0",
          "!fixed !top-3 !bottom-3 !left-3",
          "!rounded-2xl",
          "!border-border/60 !border",
          "!bg-background/95 !backdrop-blur-xl",
          "!shadow-2xl !shadow-black/20 dark:!shadow-black/50",
          "flex flex-col overflow-hidden !p-0"
        )}
      >
        <VisuallyHidden>
          <SheetTitle>Navigation menu</SheetTitle>
        </VisuallyHidden>

        {/* ── [A] Header ── */}
        <div className="flex flex-shrink-0 items-center justify-between px-5 pt-5 pb-3">
          <Logo
            logoLightUrl={settings?.logoLight}
            logoDarkUrl={settings?.logoDark}
            siteName={settings?.siteName}
          />
          <button
            type="button"
            onClick={close}
            className="text-muted-foreground hover:text-foreground hover:bg-muted -mr-1 flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── [B] Scrollable Body ── */}
        <div className="scrollbar-auto-hide flex-1 space-y-4 overflow-y-auto px-3 pb-3">
          {/* Menu */}
          <StaggerSection index={0}>
            <SectionLabel>Menu</SectionLabel>
            <div className="space-y-0.5">
              {navItems.map(({ href, label, icon }) => (
                <NavItem
                  key={href}
                  href={href}
                  label={label}
                  icon={icon}
                  isActive={href === "/" ? pathname === "/" : pathname.startsWith(href)}
                  onClose={close}
                />
              ))}
            </div>
          </StaggerSection>

          {headerPages.length > 0 && (
            <StaggerSection index={1}>
              <SectionLabel>Pages</SectionLabel>
              <div className="space-y-0.5">
                {headerPages.map((page) => (
                  <NavItem
                    key={page.id}
                    href={page.href}
                    label={page.title}
                    icon={FileText}
                    isActive={pathname === page.href}
                    onClose={close}
                  />
                ))}
              </div>
            </StaggerSection>
          )}

          {/* [B3] Browse Categories */}
          {categories.length > 0 && (
            <StaggerSection index={2}>
              <SectionLabel>Browse</SectionLabel>
              <div className="space-y-0.5">
                {categories.map((cat) => {
                  const href = `/${cat.slug}`;
                  const isActive = pathname.startsWith(href);
                  return (
                    <NavItem
                      key={cat.id}
                      href={href}
                      label={cat.name}
                      icon={({ className }) => (
                        <LucideIcon name={cat.icon ?? "tag"} className={className} />
                      )}
                      isActive={isActive}
                      onClose={close}
                    />
                  );
                })}
              </div>
            </StaggerSection>
          )}

          {/* [B4] Submit Music CTA */}
          <StaggerSection index={3}>
            <div className="from-brand via-brand/90 relative overflow-hidden rounded-xl bg-gradient-to-br to-rose-600 p-3.5 text-white">
              <div className="absolute -top-4 -right-4 h-14 w-14 rounded-full bg-white/10" />
              <div className="absolute -bottom-3 -left-3 h-10 w-10 rounded-full bg-white/5" />
              <div className="relative flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                  <Upload className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">Submit Your Music</p>
                  <p className="mt-0.5 text-[10px] leading-snug text-white/70">
                    Get featured on Nigeria&apos;s #1 blog
                  </p>
                </div>
                <Link
                  href="/submit"
                  onClick={close}
                  className="flex-shrink-0 rounded-lg bg-white/20 px-3 py-1.5 text-[11px] font-semibold backdrop-blur-sm transition-colors hover:bg-white/30"
                >
                  Go
                </Link>
              </div>
            </div>
          </StaggerSection>

          {/* [B5] Trending Tags */}
          <StaggerSection index={4}>
            <SectionLabel>Trending Tags</SectionLabel>
            <div className="scrollbar-hide -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
              {TRENDING_TAGS.map((tag) => (
                <Link
                  key={tag}
                  href={`/search?q=${encodeURIComponent(tag)}`}
                  onClick={close}
                  className="bg-muted text-muted-foreground hover:bg-brand/10 hover:text-brand flex-shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </StaggerSection>

          {/* [B6] Follow Us */}
          {socialLinks.length > 0 && (
            <StaggerSection index={5}>
              <SectionLabel>Follow Us</SectionLabel>
              <div className="flex flex-wrap gap-1.5" suppressHydrationWarning>
                {socialLinks.map(({ key, href, icon: Icon, label }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="bg-muted text-muted-foreground hover:bg-brand/10 hover:text-brand flex h-9 w-9 items-center justify-center rounded-xl transition-all"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </StaggerSection>
          )}

          {/* Footer links & copyright */}
          <StaggerSection index={5} className="pt-2">
            <div className="text-muted-foreground/60 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[10px]">
              {footerPages.slice(0, 6).map((page, index) => (
                <span key={page.id} className="inline-flex items-center gap-x-2">
                  {index > 0 && <span className="text-muted-foreground/30">·</span>}
                  <Link
                    href={page.href}
                    onClick={close}
                    className="hover:text-foreground transition-colors"
                  >
                    {page.title}
                  </Link>
                </span>
              ))}
            </div>
            <p
              className="text-muted-foreground/40 mt-1.5 text-center text-[10px]"
              suppressHydrationWarning
            >
              &copy; {new Date().getFullYear()} {copyrightName}
            </p>
          </StaggerSection>
        </div>
      </SheetContent>
    </Sheet>
  );
}
