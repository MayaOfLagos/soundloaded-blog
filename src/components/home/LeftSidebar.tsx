"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Music,
  Newspaper,
  MessageSquare,
  Disc3,
  Mic2,
  Upload,
  Instagram,
  Twitter,
  Youtube,
  Facebook,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/music", label: "Music", icon: Music },
  { href: "/gist", label: "Gist", icon: MessageSquare },
  { href: "/albums", label: "Albums", icon: Disc3 },
  { href: "/artists", label: "Artists", icon: Mic2 },
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

const SOCIALS = [
  { href: "https://instagram.com/soundloadedng", icon: Instagram, label: "Instagram" },
  { href: "https://twitter.com/soundloadedng", icon: Twitter, label: "X" },
  { href: "https://youtube.com/@soundloadedng", icon: Youtube, label: "YouTube" },
  { href: "https://facebook.com/soundloadedng", icon: Facebook, label: "Facebook" },
];

export function LeftSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] flex-col gap-5 overflow-y-auto pb-8 xl:flex">
      {/* ── Quick Nav ── */}
      <nav className="space-y-0.5">
        <p className="text-muted-foreground/60 mb-2 px-3 text-[10px] font-bold tracking-[0.2em] uppercase">
          Browse
        </p>
        {NAV_LINKS.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-brand/10 text-brand"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px] transition-colors",
                  isActive ? "text-brand" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {label}
              {isActive && <span className="bg-brand ml-auto h-1.5 w-1.5 rounded-full" />}
            </Link>
          );
        })}
      </nav>

      {/* ── Submit Music CTA ── */}
      <div className="from-brand via-brand/90 relative overflow-hidden rounded-2xl bg-gradient-to-br to-rose-600 p-4 text-white">
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-white/10" />
        <div className="absolute -bottom-4 -left-4 h-14 w-14 rounded-full bg-white/5" />

        <div className="relative">
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
      <div className="mt-auto">
        <p className="text-muted-foreground/60 mb-2.5 px-1 text-[10px] font-bold tracking-[0.2em] uppercase">
          Follow Us
        </p>
        <div className="flex gap-1.5">
          {SOCIALS.map(({ href, icon: Icon, label }) => (
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
          &copy; {new Date().getFullYear()} Soundloaded Nigeria
        </p>
      </div>
    </aside>
  );
}
