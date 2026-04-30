"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, Music, Mic2, Loader2, Files } from "lucide-react";
import axios from "axios";

type SearchResult = {
  posts: { id: string; title: string; href: string; category?: string | null }[];
  pages: { id: string; title: string; href: string; excerpt?: string | null }[];
  music: { id: string; title: string; href: string; artist?: string | null }[];
  artists: { id: string; name: string; href: string; genre?: string | null }[];
};

export function AdminSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.get<SearchResult>("/api/search", {
        params: { q },
      });
      setResults(data);
      const hasResults =
        data.posts.length > 0 ||
        data.pages.length > 0 ||
        data.music.length > 0 ||
        data.artists.length > 0;
      setOpen(hasResults || q.length >= 2);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function navigate(href: string, type?: "post" | "page" | "music" | "artist") {
    // Convert public URLs to admin URLs where applicable
    let adminHref = href;
    if (type === "page") {
      adminHref = "/admin/pages";
    } else if (href.startsWith("/music/")) {
      adminHref = "/admin/music";
    } else if (href.startsWith("/artists/")) {
      adminHref = "/admin/artists";
    } else if (href.startsWith("/")) {
      adminHref = "/admin/posts";
    }

    router.push(adminHref);
    setOpen(false);
    setQuery("");
  }

  const hasResults =
    results &&
    (results.posts.length > 0 ||
      results.pages.length > 0 ||
      results.music.length > 0 ||
      results.artists.length > 0);

  return (
    <div ref={containerRef} className="relative hidden md:block">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search... ⌘K"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results && query.length >= 2) setOpen(true);
          }}
          className="border-input bg-muted/50 text-foreground placeholder:text-muted-foreground focus:border-ring focus:bg-background focus:ring-ring h-9 w-64 rounded-md border pr-3 pl-9 text-sm transition-colors focus:ring-1 focus:outline-none"
        />
        {loading && (
          <Loader2 className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin" />
        )}
      </div>

      {/* Results dropdown */}
      {open && query.length >= 2 && (
        <div className="border-border bg-popover absolute top-full left-0 z-50 mt-1 w-80 rounded-md border p-1 shadow-lg">
          {!hasResults && !loading && (
            <p className="text-muted-foreground px-3 py-6 text-center text-sm">
              No results found for &ldquo;{query}&rdquo;
            </p>
          )}

          {results && results.posts.length > 0 && (
            <div>
              <p className="text-muted-foreground px-3 py-1.5 text-xs font-semibold tracking-wider uppercase">
                Posts
              </p>
              {results.posts.slice(0, 5).map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => navigate(post.href, "post")}
                  className="text-popover-foreground hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-left text-sm transition-colors"
                >
                  <FileText className="text-muted-foreground h-4 w-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{post.title}</p>
                    {post.category && (
                      <p className="text-muted-foreground truncate text-xs">{post.category}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {results && results.pages.length > 0 && (
            <div>
              <p className="text-muted-foreground px-3 py-1.5 text-xs font-semibold tracking-wider uppercase">
                Pages
              </p>
              {results.pages.slice(0, 5).map((page) => (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => navigate(page.href, "page")}
                  className="text-popover-foreground hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-left text-sm transition-colors"
                >
                  <Files className="text-muted-foreground h-4 w-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{page.title}</p>
                    {page.excerpt && (
                      <p className="text-muted-foreground truncate text-xs">{page.excerpt}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {results && results.music.length > 0 && (
            <div>
              <p className="text-muted-foreground px-3 py-1.5 text-xs font-semibold tracking-wider uppercase">
                Music
              </p>
              {results.music.slice(0, 5).map((track) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => navigate(track.href, "music")}
                  className="text-popover-foreground hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-left text-sm transition-colors"
                >
                  <Music className="text-muted-foreground h-4 w-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{track.title}</p>
                    {track.artist && (
                      <p className="text-muted-foreground truncate text-xs">{track.artist}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {results && results.artists.length > 0 && (
            <div>
              <p className="text-muted-foreground px-3 py-1.5 text-xs font-semibold tracking-wider uppercase">
                Artists
              </p>
              {results.artists.slice(0, 5).map((artist) => (
                <button
                  key={artist.id}
                  type="button"
                  onClick={() => navigate(artist.href, "artist")}
                  className="text-popover-foreground hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-left text-sm transition-colors"
                >
                  <Mic2 className="text-muted-foreground h-4 w-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{artist.name}</p>
                    {artist.genre && (
                      <p className="text-muted-foreground truncate text-xs">{artist.genre}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
