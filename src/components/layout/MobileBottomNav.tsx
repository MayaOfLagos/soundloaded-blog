"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Search01Icon,
  MultiplicationSignIcon,
  Home01Icon,
  HeadphonesIcon,
  News01Icon,
  BubbleChatIcon,
  Mic01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", icon: Home01Icon, label: "Home" },
  { href: "/music", icon: HeadphonesIcon, label: "Music" },
  { href: "/news", icon: News01Icon, label: "News" },
  { href: "/gist", icon: BubbleChatIcon, label: "Gist" },
  { href: "/artists", icon: Mic01Icon, label: "Artists" },
] as const;

const SPRING = { type: "spring", damping: 22, stiffness: 260, mass: 1 } as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const openSearch = () => {
    setIsSearchOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setQuery("");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      closeSearch();
    }
  };

  return (
    <div className="fixed right-0 bottom-0 left-0 z-40 md:hidden">
      {/* Frosted glass bar */}
      <div className="border-border/50 bg-background/90 border-t shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:shadow-[0_-4px_24px_rgba(0,0,0,0.3)]">
        <div className="relative">
          {/* ── Search overlay ── */}
          <AnimatePresence>
            {isSearchOpen && (
              <motion.form
                onSubmit={handleSearch}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 z-10 flex items-center gap-2 px-4"
              >
                <div className="bg-muted/80 flex flex-1 items-center gap-2.5 rounded-2xl px-4 py-2.5">
                  <HugeiconsIcon
                    icon={Search01Icon}
                    className="text-muted-foreground h-5 w-5 shrink-0"
                  />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search artists, songs, news…"
                    className="text-foreground placeholder:text-muted-foreground w-full bg-transparent text-sm outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <button
                  type="button"
                  onClick={closeSearch}
                  className="text-muted-foreground hover:text-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors"
                  aria-label="Close search"
                >
                  <HugeiconsIcon icon={MultiplicationSignIcon} className="h-5 w-5" />
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* ── Nav items ── */}
          <nav
            className={cn(
              "flex items-center justify-around px-2 pt-2 pb-[env(safe-area-inset-bottom,8px)] transition-opacity",
              isSearchOpen && "pointer-events-none opacity-0"
            )}
          >
            {NAV_ITEMS.map(({ href, icon, label }) => {
              const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className="group relative flex min-w-[56px] flex-col items-center gap-0.5 py-1"
                  aria-label={label}
                >
                  {/* Active pill behind icon */}
                  {isActive && (
                    <motion.span
                      layoutId="bottomnav-active"
                      className="bg-brand/10 absolute -top-0.5 h-8 w-12 rounded-full"
                      transition={SPRING}
                    />
                  )}
                  <HugeiconsIcon
                    icon={icon}
                    className={cn(
                      "relative z-10 h-6 w-6 transition-colors",
                      isActive ? "text-brand" : "text-muted-foreground group-active:text-foreground"
                    )}
                  />
                  <span
                    className={cn(
                      "relative z-10 text-[10px] font-semibold transition-colors",
                      isActive ? "text-brand" : "text-muted-foreground"
                    )}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}

            {/* Search button */}
            <button
              type="button"
              onClick={openSearch}
              className="group relative flex min-w-[56px] flex-col items-center gap-0.5 py-1"
              aria-label="Search"
            >
              <HugeiconsIcon
                icon={Search01Icon}
                className="text-muted-foreground group-active:text-foreground h-6 w-6 transition-colors"
              />
              <span className="text-muted-foreground text-[10px] font-semibold">Search</span>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
