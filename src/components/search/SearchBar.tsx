"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, X, Newspaper, Music, Mic2, ArrowRight, Loader2, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

interface PostResult {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  coverImage?: string | null;
  category?: string | { name: string; slug?: string } | null;
  href: string;
}

interface MusicResult {
  id: string;
  slug: string;
  title: string;
  artist?: string | null;
  coverArt?: string | null;
  genre?: string | null;
  href: string;
}

interface PageResult {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  href: string;
}

interface ArtistResult {
  id: string;
  slug: string;
  name: string;
  photo?: string | null;
  genre?: string | null;
  href: string;
}

interface SearchResults {
  posts: PostResult[];
  pages: PageResult[];
  music: MusicResult[];
  artists: ArtistResult[];
}

type FlatItem =
  | { type: "post"; data: PostResult }
  | { type: "page"; data: PageResult }
  | { type: "music"; data: MusicResult }
  | { type: "artist"; data: ArtistResult };

export function SearchBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({
    posts: [],
    pages: [],
    music: [],
    artists: [],
  });
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const flatItems: FlatItem[] = [
    ...results.posts.map((p) => ({ type: "post" as const, data: p })),
    ...results.pages.map((p) => ({ type: "page" as const, data: p })),
    ...results.music.map((m) => ({ type: "music" as const, data: m })),
    ...results.artists.map((a) => ({ type: "artist" as const, data: a })),
  ];

  const hasResults = flatItems.length > 0;
  const showDropdown =
    open &&
    debouncedQuery.length >= 2 &&
    (loading || hasResults || (!loading && debouncedQuery === query));

  // Cmd+K shortcut — defined after closeSearch
  const toggleSearch = useCallback(() => {
    setOpen((prev) => {
      if (prev) {
        setQuery("");
        setResults({ posts: [], pages: [], music: [], artists: [] });
        setActiveIndex(-1);
      }
      return !prev;
    });
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleSearch();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [toggleSearch]);

  // Auto-focus when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close and reset search state
  const closeSearch = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults({ posts: [], pages: [], music: [], artists: [] });
    setActiveIndex(-1);
  }, []);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeSearch();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, closeSearch]);

  // Fetch results
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear on empty query
      setResults({ posts: [], pages: [], music: [], artists: [] });

      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`Search failed: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setResults({
          posts: data.posts ?? [],
          pages: data.pages ?? [],
          music: data.music ?? [],
          artists: data.artists ?? [],
        });
        setActiveIndex(-1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [debouncedQuery]);

  const navigate = useCallback(
    (href: string) => {
      router.push(href);
      closeSearch();
    },
    [router, closeSearch]
  );

  const getItemHref = (item: FlatItem): string => {
    if (item.type === "artist") return item.data.href;
    return item.data.href;
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      closeSearch();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i < flatItems.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i > 0 ? i - 1 : flatItems.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0 && flatItems[activeIndex]) {
      e.preventDefault();
      navigate(getItemHref(flatItems[activeIndex]));
    }
  };

  const listboxId = "search-results-listbox";

  return (
    <div ref={containerRef} className="relative">
      {/* Search trigger button */}
      <AnimatePresence mode="wait">
        {!open ? (
          <motion.button
            key="trigger"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(true)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/60 flex h-9 w-9 items-center justify-center rounded-full transition-colors"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </motion.button>
        ) : (
          <motion.div
            key="input"
            initial={{ width: 36, opacity: 0.5 }}
            animate={{ width: "min(400px, 50vw)", opacity: 1 }}
            exit={{ width: 36, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="flex items-center"
          >
            <div className="bg-muted/80 ring-border/50 flex w-full items-center gap-2 rounded-full px-3 py-1.5 ring-1 backdrop-blur">
              {loading ? (
                <Loader2 className="text-muted-foreground h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <Search className="text-muted-foreground h-4 w-4 shrink-0" />
              )}
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search music, news, artists..."
                className="placeholder:text-muted-foreground/60 w-full bg-transparent text-sm outline-none"
                role="combobox"
                aria-expanded={showDropdown}
                aria-controls={listboxId}
                aria-activedescendant={activeIndex >= 0 ? `search-item-${activeIndex}` : undefined}
                aria-autocomplete="list"
              />
              <button
                onClick={closeSearch}
                className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                aria-label="Close search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile overlay - full width below navbar */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 top-14 z-40 bg-black/20 backdrop-blur-sm md:hidden"
            onClick={closeSearch}
          />
        )}
      </AnimatePresence>

      {/* Dropdown results */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="bg-card ring-border/50 absolute top-full right-0 z-50 mt-2 w-[min(420px,90vw)] overflow-hidden rounded-2xl shadow-xl ring-1"
            id={listboxId}
            role="listbox"
          >
            <div className="max-h-[min(70vh,480px)] overflow-y-auto">
              {loading && !hasResults && <SearchSkeleton />}

              {!loading && debouncedQuery.length >= 2 && !hasResults && (
                <div className="text-muted-foreground px-4 py-8 text-center text-sm">
                  No results for &ldquo;{debouncedQuery}&rdquo;
                </div>
              )}

              {results.posts.length > 0 && (
                <ResultSection label="Posts" icon={<Newspaper className="h-3.5 w-3.5" />}>
                  {results.posts.map((post, i) => {
                    const idx = i;
                    return (
                      <ResultItem
                        key={post.id}
                        id={`search-item-${idx}`}
                        active={activeIndex === idx}
                        thumbnail={post.coverImage}
                        title={post.title}
                        subtitle={
                          typeof post.category === "string"
                            ? post.category
                            : (post.category?.name ?? undefined)
                        }
                        onClick={() => navigate(post.href)}
                        onMouseEnter={() => setActiveIndex(idx)}
                      />
                    );
                  })}
                </ResultSection>
              )}

              {results.pages.length > 0 && (
                <ResultSection label="Pages" icon={<FileText className="h-3.5 w-3.5" />}>
                  {results.pages.map((page, i) => {
                    const idx = results.posts.length + i;
                    return (
                      <ResultItem
                        key={page.id}
                        id={`search-item-${idx}`}
                        active={activeIndex === idx}
                        title={page.title}
                        subtitle={page.excerpt ?? undefined}
                        onClick={() => navigate(page.href)}
                        onMouseEnter={() => setActiveIndex(idx)}
                      />
                    );
                  })}
                </ResultSection>
              )}

              {results.music.length > 0 && (
                <ResultSection label="Music" icon={<Music className="h-3.5 w-3.5" />}>
                  {results.music.map((track, i) => {
                    const idx = results.posts.length + results.pages.length + i;
                    return (
                      <ResultItem
                        key={track.id}
                        id={`search-item-${idx}`}
                        active={activeIndex === idx}
                        thumbnail={track.coverArt}
                        title={track.title}
                        subtitle={track.artist ?? undefined}
                        onClick={() => navigate(track.href)}
                        onMouseEnter={() => setActiveIndex(idx)}
                      />
                    );
                  })}
                </ResultSection>
              )}

              {results.artists.length > 0 && (
                <ResultSection label="Artists" icon={<Mic2 className="h-3.5 w-3.5" />}>
                  {results.artists.map((artist, i) => {
                    const idx = results.posts.length + results.pages.length + results.music.length + i;
                    return (
                      <ResultItem
                        key={artist.id}
                        id={`search-item-${idx}`}
                        active={activeIndex === idx}
                        thumbnail={artist.photo}
                        title={artist.name}
                        subtitle={artist.genre ?? undefined}
                        onClick={() => navigate(artist.href)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        rounded
                      />
                    );
                  })}
                </ResultSection>
              )}
            </div>

            {/* Footer hint */}
            <div className="border-border/50 text-muted-foreground flex items-center justify-between border-t px-3 py-2 text-[11px]">
              <span>
                <kbd className="bg-muted rounded px-1 py-0.5 font-mono text-[10px]">↑↓</kbd>{" "}
                navigate <kbd className="bg-muted rounded px-1 py-0.5 font-mono text-[10px]">↵</kbd>{" "}
                select
              </span>
              <span>
                <kbd className="bg-muted rounded px-1 py-0.5 font-mono text-[10px]">esc</kbd> close
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResultSection({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-muted-foreground flex items-center gap-1.5 px-3 pt-3 pb-1 text-[11px] font-semibold tracking-wider uppercase">
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}

function ResultItem({
  id,
  active,
  thumbnail,
  title,
  subtitle,
  onClick,
  onMouseEnter,
  rounded,
}: {
  id: string;
  active: boolean;
  thumbnail?: string | null;
  title: string;
  subtitle?: string;
  onClick: () => void;
  onMouseEnter: () => void;
  rounded?: boolean;
}) {
  return (
    <button
      id={id}
      role="option"
      aria-selected={active}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
        active ? "bg-muted/80" : "hover:bg-muted/40"
      )}
    >
      <div
        className={cn(
          "bg-muted h-10 w-10 shrink-0 overflow-hidden",
          rounded ? "rounded-full" : "rounded-lg"
        )}
      >
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt=""
            width={40}
            height={40}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Music className="text-muted-foreground/40 h-4 w-4" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm font-medium">{title}</p>
        {subtitle && <p className="text-muted-foreground truncate text-xs">{subtitle}</p>}
      </div>
      <ArrowRight
        className={cn(
          "text-muted-foreground/40 h-3.5 w-3.5 shrink-0 transition-opacity",
          active ? "opacity-100" : "opacity-0"
        )}
      />
    </button>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-1 p-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <div className="bg-muted h-10 w-10 animate-pulse rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <div className="bg-muted h-3.5 w-3/4 animate-pulse rounded" />
            <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
