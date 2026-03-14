"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Music,
  Disc3,
  Mic2,
  TrendingUp,
  Clock,
  Heart,
  ListMusic,
  Radio,
  Headphones,
  Library,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store/player.store";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/music", label: "Browse", icon: Music, exact: true },
  { href: "/music?sort=latest", label: "New Releases", icon: Clock },
  { href: "/music?sort=popular", label: "Trending", icon: TrendingUp },
];

const LIBRARY_ITEMS = [
  { href: "/albums", label: "Albums", icon: Disc3 },
  { href: "/artists", label: "Artists", icon: Mic2 },
  { href: "/library?tab=music", label: "My Library", icon: Library },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/library?tab=playlists", label: "Playlists", icon: ListMusic },
];

const GENRE_TAGS = [
  "Afrobeats",
  "Amapiano",
  "Gospel",
  "Hip Hop",
  "R&B",
  "Fuji",
  "Highlife",
  "Afropop",
  "Reggae",
  "Pop",
];

export function MusicLeftSidebar() {
  const pathname = usePathname();
  const { currentTrack, queue } = usePlayerStore();

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] flex-col xl:flex">
      {/* Navigation */}
      <nav className="scrollbar-auto-hide min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {/* Main nav */}
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                isActive
                  ? "bg-brand/10 text-brand"
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

        {/* Divider */}
        <div className="border-border/40 mx-3 border-t pt-1" />

        {/* Library section */}
        <p className="text-muted-foreground/60 px-3 pt-2 pb-1 text-[10px] font-bold tracking-[0.2em] uppercase">
          Your Library
        </p>
        {LIBRARY_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href.split("?")[0]);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                isActive
                  ? "bg-brand/10 text-brand"
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
            </Link>
          );
        })}

        {/* Divider */}
        <div className="border-border/40 mx-3 border-t pt-1" />

        {/* Genres */}
        <p className="text-muted-foreground/60 px-3 pt-2 pb-1 text-[10px] font-bold tracking-[0.2em] uppercase">
          Genres
        </p>
        <div className="flex flex-wrap gap-1.5 px-3 pb-3">
          {GENRE_TAGS.map((genre) => (
            <Link
              key={genre}
              href={`/search?q=${encodeURIComponent(genre)}`}
              className="bg-muted text-muted-foreground hover:bg-brand/10 hover:text-brand rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all"
            >
              {genre}
            </Link>
          ))}
        </div>
      </nav>

      {/* Fixed bottom section */}
      <div className="flex-shrink-0 space-y-4 pt-4">
        {/* Now Playing mini-card */}
        {currentTrack && (
          <div className="bg-brand/5 ring-brand/20 rounded-xl p-3 ring-1">
            <div className="flex items-center gap-2.5">
              <div className="bg-brand/15 flex h-8 w-8 items-center justify-center rounded-lg">
                <Headphones className="text-brand h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-xs font-bold">{currentTrack.title}</p>
                <p className="text-muted-foreground truncate text-[10px]">{currentTrack.artist}</p>
              </div>
            </div>
            {queue.length > 1 && (
              <p className="text-muted-foreground mt-2 text-[10px]">
                <Radio className="mr-1 inline h-3 w-3" />
                {queue.length} tracks in queue
              </p>
            )}
          </div>
        )}

        {/* Submit Music CTA */}
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
      </div>
    </aside>
  );
}
