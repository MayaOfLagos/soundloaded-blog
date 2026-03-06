"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
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

const SPRING = { type: "spring", damping: 20, stiffness: 230, mass: 1.2 } as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const openSearch = () => {
    setIsSearchExpanded(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const closeSearch = () => {
    setIsSearchExpanded(false);
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
    <div className="fixed right-0 bottom-20 left-0 z-40 flex justify-center px-4 md:hidden">
      <form onSubmit={handleSearch} className="flex items-center gap-2.5">
        {/* ── Search pill ── */}
        <motion.div
          layout
          transition={SPRING}
          onClick={() => !isSearchExpanded && openSearch()}
          className={cn(
            "relative flex h-14 cursor-pointer items-center overflow-hidden rounded-[3rem]",
            "border-border bg-background/95 border px-[1.125rem] shadow-lg backdrop-blur-xl",
            isSearchExpanded ? "min-w-[180px] flex-1" : ""
          )}
        >
          <div className="shrink-0">
            <HugeiconsIcon icon={Search01Icon} className="text-foreground h-5 w-5" />
          </div>

          <motion.div
            initial={false}
            animate={{
              width: isSearchExpanded ? "auto" : "0px",
              opacity: isSearchExpanded ? 1 : 0,
              filter: isSearchExpanded ? "blur(0px)" : "blur(4px)",
              marginLeft: isSearchExpanded ? "10px" : "0px",
            }}
            transition={SPRING}
            className="-mb-0.5 flex items-center overflow-hidden"
          >
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Artists, songs, news…"
              className="text-foreground placeholder:text-muted-foreground w-full min-w-[140px] border-0 bg-transparent text-sm outline-none focus-visible:ring-0"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        </motion.div>

        {/* ── Nav pill ── */}
        <motion.div
          layout
          transition={SPRING}
          className="border-border bg-background/95 relative flex h-14 items-center overflow-hidden rounded-[3rem] border shadow-lg backdrop-blur-xl"
        >
          <motion.div
            initial={false}
            animate={{ width: isSearchExpanded ? "56px" : "auto" }}
            transition={SPRING}
            className="relative flex h-full items-center overflow-hidden"
          >
            {/* Nav icon buttons */}
            <motion.div
              initial={false}
              animate={{
                opacity: isSearchExpanded ? 0 : 1,
                filter: isSearchExpanded ? "blur(4px)" : "blur(0px)",
              }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-0.5 px-2 whitespace-nowrap"
            >
              {NAV_ITEMS.map(({ href, icon, label }) => {
                const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-label={label}
                    className={cn(
                      "relative flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-150",
                      isActive ? "bg-brand/10" : "hover:bg-muted active:bg-muted"
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="bottom-nav-indicator"
                        className="bg-brand/10 absolute inset-0 rounded-full"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                    <HugeiconsIcon
                      icon={icon}
                      className={cn(
                        "relative z-10 h-5 w-5 transition-colors duration-150",
                        isActive ? "text-brand" : "text-muted-foreground"
                      )}
                    />
                  </Link>
                );
              })}
            </motion.div>

            {/* Close button */}
            <motion.div
              initial={false}
              animate={{
                opacity: isSearchExpanded ? 1 : 0,
                filter: isSearchExpanded ? "blur(0px)" : "blur(4px)",
              }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ pointerEvents: isSearchExpanded ? "auto" : "none" }}
            >
              <button
                type="button"
                onClick={closeSearch}
                className="hover:bg-muted flex h-10 w-10 items-center justify-center rounded-full transition-colors"
                aria-label="Close search"
              >
                <HugeiconsIcon icon={MultiplicationSignIcon} className="text-foreground h-5 w-5" />
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      </form>
    </div>
  );
}
