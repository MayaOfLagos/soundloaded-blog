"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Upload,
  Music,
  Tag,
  Instagram,
  Twitter,
  Youtube,
  Facebook,
  Send,
  Phone,
  icons,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

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

export function LeftSidebar() {
  const pathname = usePathname();
  const { data: settings } = useSettings();
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await axios.get<{ categories: Category[] }>("/api/categories");
      return res.data.categories;
    },
    staleTime: 5 * 60 * 1000,
  });
  const categories = categoriesData ?? [];

  const socialLinks = settings
    ? (["instagram", "twitter", "youtube", "facebook", "tiktok", "telegram"] as const)
        .filter((key) => settings[key])
        .map((key) => ({
          href: SOCIAL_URL_MAP[key](settings[key]),
          icon: SOCIAL_ICON_MAP[key],
          label: key.charAt(0).toUpperCase() + key.slice(1),
        }))
    : [];

  const copyrightName =
    settings?.copyrightText?.replace(". All rights reserved.", "") || "Soundloaded Nigeria";

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] flex-col xl:flex">
      {/* ── Quick Nav (scrollable) ── */}
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {/* Home link */}
        <Link
          href="/"
          className={cn(
            "group flex items-center gap-3.5 rounded-xl px-3 py-3 text-[15px] font-semibold transition-all duration-200",
            pathname === "/"
              ? "bg-brand/10 text-brand font-bold"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              pathname === "/"
                ? "bg-brand/15 text-brand"
                : "bg-muted text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
            )}
          >
            <Home className="h-[18px] w-[18px]" />
          </div>
          Home
          {pathname === "/" && <span className="bg-brand ml-auto h-2 w-2 rounded-full" />}
        </Link>
        {/* Dynamic categories */}
        {categories.map((cat) => {
          const href = `/${cat.slug}`;
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={cat.id}
              href={href}
              className={cn(
                "group flex items-center gap-3.5 rounded-xl px-3 py-3 text-[15px] font-semibold transition-all duration-200",
                isActive
                  ? "bg-brand/10 text-brand font-bold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                  isActive
                    ? "bg-brand/15 text-brand"
                    : "bg-muted text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
                )}
              >
                <LucideIcon name={cat.icon ?? "tag"} className="h-[18px] w-[18px]" />
              </div>
              {cat.name}
              {isActive && <span className="bg-brand ml-auto h-2 w-2 rounded-full" />}
            </Link>
          );
        })}
      </nav>

      {/* ── Fixed bottom section ── */}
      <div className="flex-shrink-0 space-y-5 pt-5">
        {/* ── Submit Music CTA ── */}
        <div className="from-brand via-brand/90 relative overflow-hidden rounded-2xl bg-gradient-to-br to-rose-600 p-4 text-white">
          <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 h-14 w-14 rounded-full bg-white/5" />

          <div className="relative flex flex-col items-center text-center">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Upload className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold">Submit Your Music</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-white/70">
              Get your music featured on Nigeria&apos;s #1 blog
            </p>
            <Link
              href="/submit"
              className="mt-3 inline-flex items-center rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm transition-colors hover:bg-white/30"
            >
              Submit now
            </Link>
          </div>
        </div>

        {/* ── Trending Tags ── */}
        <div>
          <p className="text-muted-foreground/60 mb-2.5 px-1 text-[10px] font-bold tracking-[0.2em] uppercase">
            Trending Tags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {TRENDING_TAGS.map((tag) => (
              <Link
                key={tag}
                href={`/search?q=${encodeURIComponent(tag)}`}
                className="bg-muted text-muted-foreground hover:bg-brand/10 hover:text-brand rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>

        {/* ── Follow Us ── */}
        <div>
          <p className="text-muted-foreground/60 mb-2.5 px-1 text-[10px] font-bold tracking-[0.2em] uppercase">
            Follow Us
          </p>
          <div className="flex gap-1.5" suppressHydrationWarning>
            {socialLinks.map(({ href, icon: Icon, label }) => (
              <a
                key={href}
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
          <p className="text-muted-foreground/50 mt-3 text-[10px]">
            &copy; {new Date().getFullYear()} {copyrightName}
          </p>
        </div>
      </div>
    </aside>
  );
}
