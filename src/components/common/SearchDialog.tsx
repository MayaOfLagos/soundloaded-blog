"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Music, Newspaper, Mic2, Disc } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchResult {
  id: string;
  title: string;
  type: "post" | "music" | "artist" | "album";
  slug: string;
  subtitle?: string;
  href?: string;
}

const NAV_SHORTCUTS = [
  { icon: Newspaper, label: "Music News", href: "/news" },
  { icon: Music, label: "Free Downloads", href: "/music" },
  { icon: Disc, label: "Albums", href: "/albums" },
  { icon: Mic2, label: "Artists", href: "/artists" },
];

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();

  // Cmd+K shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Fetch search results
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((data) => setResults(data.results ?? []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const navigate = (href: string) => {
    router.push(href);
    setOpen(false);
    setQuery("");
  };

  const getResultHref = (result: SearchResult) => {
    if (result.href) return result.href;
    switch (result.type) {
      case "post":
        return `/${result.slug}`;
      case "music":
        return `/music/${result.slug}`;
      case "artist":
        return `/artists/${result.slug}`;
      case "album":
        return `/albums/${result.slug}`;
    }
  };

  const getResultIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "post":
        return <Newspaper className="text-muted-foreground h-4 w-4" />;
      case "music":
        return <Music className="text-brand h-4 w-4" />;
      case "artist":
        return <Mic2 className="text-muted-foreground h-4 w-4" />;
      case "album":
        return <Disc className="text-muted-foreground h-4 w-4" />;
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={() => setOpen(true)}
        aria-label="Search"
      >
        <Search className="text-muted-foreground h-4 w-4" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle className="sr-only">Search</DialogTitle>
        <CommandInput
          placeholder="Search music, news, artists..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && (
            <div className="text-muted-foreground py-6 text-center text-sm">Searching...</div>
          )}

          {!loading && debouncedQuery.length >= 2 && results.length === 0 && (
            <CommandEmpty>No results found for &ldquo;{debouncedQuery}&rdquo;</CommandEmpty>
          )}

          {results.length > 0 && (
            <CommandGroup heading="Results">
              {results.map((result) => (
                <CommandItem
                  key={`${result.type}-${result.id}`}
                  onSelect={() => navigate(getResultHref(result))}
                  className="flex items-center gap-3"
                >
                  {getResultIcon(result.type)}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{result.title}</span>
                    {result.subtitle && (
                      <span className="text-muted-foreground text-xs">{result.subtitle}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandSeparator />

          <CommandGroup heading="Quick Links">
            {NAV_SHORTCUTS.map(({ icon: Icon, label, href }) => (
              <CommandItem key={href} onSelect={() => navigate(href)}>
                <Icon className="text-muted-foreground h-4 w-4" />
                <span>{label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
