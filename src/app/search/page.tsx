"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, Loader2, FileText, Music, AlertCircle, X, Play } from "lucide-react";
import { PostCard, type PostCardData } from "@/components/blog/PostCard";
import { MusicShelfCard } from "@/components/music/MusicShelfCard";
import { ArtistCard } from "@/components/music/ArtistCard";
import { GenreBrowseCard } from "@/components/music/GenreBrowseCard";
import { ScrollShelf, ShelfItem } from "@/components/music/ScrollShelf";
import { Input } from "@/components/ui/input";
import { BROWSE_CATEGORIES, BROWSE_GENRES, getGenreGradient } from "@/lib/genre-colors";
import { cn } from "@/lib/utils";
import type { MusicCardData, ArtistCardData } from "@/lib/api/music";

interface SearchResults {
  posts: PostCardData[];
  music: MusicCardData[];
  artists: ArtistCardData[];
}

const RECENT_SEARCHES_KEY = "soundloaded:recent-searches";
const MAX_RECENT = 8;

function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(term: string) {
  try {
    const recent = getRecentSearches();
    const updated = [term, ...recent.filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(
      0,
      MAX_RECENT
    );
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    /* noop */
  }
}

function clearRecentSearches() {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    /* noop */
  }
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") ?? "";
  const [inputValue, setInputValue] = useState(q);
  const [results, setResults] = useState<SearchResults>({
    posts: [],
    music: [],
    artists: [],
  });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
    fetch("/api/search/trending")
      .then((r) => r.json())
      .then((data) => setTrendingSearches(data.trending ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setInputValue(q);
    if (!q || q.length < 2) {
      setResults({ posts: [], music: [], artists: [] });
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setHasSearched(true);
    saveRecentSearch(q);
    setRecentSearches(getRecentSearches());
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) =>
        setResults({
          posts: data.posts ?? [],
          music: data.music ?? [],
          artists: data.artists ?? [],
        })
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [q]);

  // Live search debounce
  useEffect(() => {
    if (inputValue === q) return;
    const trimmed = inputValue.trim();
    if (trimmed.length < 2) {
      if (q) router.replace("/search");
      return;
    }
    const timer = setTimeout(() => {
      router.replace(`/search?q=${encodeURIComponent(trimmed)}`);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  function handleClear() {
    setInputValue("");
    router.replace("/search");
    inputRef.current?.focus();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed.length < 2) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  function handleSuggestion(term: string) {
    setInputValue(term);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  function trackSearchClick(
    entityType: "POST" | "MUSIC" | "ARTIST",
    entityId: string,
    position: number,
    href: string
  ) {
    const payload = JSON.stringify({
      entityType,
      entityId,
      surface: "SEARCH_RESULTS",
      queryText: q,
      position,
      href,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/recommendations/click",
        new Blob([payload], { type: "application/json" })
      );
      return;
    }

    fetch("/api/recommendations/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }

  const total = results.posts.length + results.music.length + results.artists.length;

  return (
    <div className="@container py-3">
      {/* Search Input */}
      <div className="mb-6">
        <form onSubmit={handleSubmit} className="relative max-w-2xl">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2" />
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="What do you want to listen to?"
            className="bg-card/80 border-border/50 focus-visible:border-brand h-12 rounded-full pr-10 pl-12 text-base shadow-sm backdrop-blur-sm"
            autoFocus={!q}
          />
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-4 -translate-y-1/2 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>
        {q && !loading && (
          <p className="text-muted-foreground mt-3 text-sm">
            {total === 0
              ? `No results for "${q}"`
              : `${total} result${total !== 1 ? "s" : ""} for "${q}"`}
          </p>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="text-brand h-8 w-8 animate-spin" />
        </div>
      )}

      {/* Recent & trending tags */}
      {!q && (recentSearches.length > 0 || trendingSearches.length > 0) && (
        <div className="mb-6 space-y-3">
          {recentSearches.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Recent
                </p>
                <button
                  type="button"
                  onClick={() => {
                    clearRecentSearches();
                    setRecentSearches([]);
                  }}
                  className="text-muted-foreground hover:text-foreground text-xs transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleSuggestion(term)}
                    className="bg-brand/10 text-brand hover:bg-brand/20 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all hover:scale-[1.02]"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
          {trendingSearches.length > 0 && (
            <div>
              <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                Trending
              </p>
              <div className="flex flex-wrap gap-2">
                {trendingSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleSuggestion(term)}
                    className="bg-muted/60 text-muted-foreground hover:bg-brand/10 hover:text-brand border-border/40 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all hover:scale-[1.02]"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No query — browse all */}
      {!loading && !q && (
        <div>
          <h2 className="text-foreground mb-4 text-xl font-bold">Browse All</h2>
          <div className="grid grid-cols-2 gap-3 @md:grid-cols-3 @3xl:grid-cols-4">
            {BROWSE_CATEGORIES.map((cat) => (
              <GenreBrowseCard
                key={cat.label}
                label={cat.label}
                href={cat.href}
                gradient={cat.bg}
              />
            ))}
            {BROWSE_GENRES.map((genre) => (
              <GenreBrowseCard
                key={genre}
                label={genre}
                href={`/search?q=${encodeURIComponent(genre)}`}
                gradient={getGenreGradient(genre)}
              />
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {!loading && hasSearched && q && total === 0 && (
        <div className="py-16 text-center">
          <AlertCircle className="text-muted-foreground/30 mx-auto mb-3 h-12 w-12" />
          <p className="text-foreground text-xl font-bold">No results for &ldquo;{q}&rdquo;</p>
          <p className="text-muted-foreground mt-2">
            Try different keywords or browse the sections below.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
            {[
              { href: "/music", label: "Free Music Downloads" },
              { href: "/news", label: "Music News" },
              { href: "/gist", label: "Gist" },
              { href: "/artists", label: "Artists" },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="text-brand font-medium hover:underline">
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Results — Spotify-style */}
      {!loading && total > 0 && (
        <div className="space-y-8">
          {/* Top Result + Songs */}
          <div className="grid grid-cols-1 gap-4 @lg:grid-cols-[1fr_1.5fr]">
            {(() => {
              const topArtist = results.artists[0];
              const topTrack = results.music[0];
              const topPost = results.posts[0];
              const top = topArtist || topTrack || topPost;
              if (!top) return null;

              const isArtist = !!topArtist;
              const isTrack = !isArtist && !!topTrack;
              const title = isArtist ? topArtist.name : isTrack ? topTrack.title : topPost!.title;
              const subtitle = isTrack
                ? ((topTrack as MusicCardData & { artist?: string }).artist ?? "")
                : isArtist
                  ? (topArtist.genre ?? "Artist")
                  : "";
              const coverSrc = isArtist
                ? topArtist.photo
                : isTrack
                  ? topTrack.coverArt
                  : topPost!.coverImage;
              const href = isArtist
                ? `/artists/${topArtist.slug}`
                : isTrack
                  ? `/music/${topTrack.slug}`
                  : (topPost as PostCardData).href || `/${topPost!.slug}`;
              const badge = isArtist ? "Artist" : isTrack ? "Song" : "Article";
              const entityType = isArtist ? "ARTIST" : isTrack ? "MUSIC" : "POST";
              const entityId = isArtist ? topArtist.id : isTrack ? topTrack.id : topPost!.id;

              return (
                <div>
                  <h2 className="text-foreground mb-3 text-sm font-bold">Top Result</h2>
                  <Link
                    href={href}
                    onClick={() => trackSearchClick(entityType, entityId, 1, href)}
                    className="bg-card/50 ring-border/40 group hover:ring-brand/30 relative flex h-56 flex-col justify-end overflow-hidden rounded-2xl p-5 ring-1 transition-all hover:shadow-lg"
                  >
                    {coverSrc ? (
                      <Image
                        src={coverSrc}
                        alt={title}
                        fill
                        className={cn(
                          "object-cover opacity-40 transition-transform duration-500 group-hover:scale-105",
                          isArtist && "object-top"
                        )}
                        sizes="400px"
                      />
                    ) : (
                      <div className="from-brand/20 to-muted absolute inset-0 bg-gradient-to-br" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="relative z-10">
                      <h3 className="line-clamp-2 text-2xl leading-tight font-extrabold text-white">
                        {title}
                      </h3>
                      {subtitle && <p className="mt-1 text-sm text-white/70">{subtitle}</p>}
                      <span className="bg-brand text-brand-foreground mt-3 inline-block rounded-full px-3 py-0.5 text-xs font-bold">
                        {badge}
                      </span>
                    </div>
                    <div className="bg-brand text-brand-foreground absolute right-4 bottom-4 z-10 flex h-12 w-12 items-center justify-center rounded-full opacity-0 shadow-xl transition-all duration-300 group-hover:scale-105 group-hover:opacity-100">
                      <Play
                        className="h-5 w-5 translate-x-[1px]"
                        fill="currentColor"
                        strokeWidth={0}
                      />
                    </div>
                  </Link>
                </div>
              );
            })()}

            {results.music.length > 0 && (
              <div>
                <h2 className="text-foreground mb-3 text-sm font-bold">Songs</h2>
                <div className="bg-card/30 ring-border/40 overflow-hidden rounded-2xl ring-1">
                  <div className="divide-border/20 divide-y">
                    {results.music.slice(0, 4).map((track, index) => (
                      <Link
                        key={track.id}
                        href={`/music/${track.slug}`}
                        onClick={() =>
                          trackSearchClick("MUSIC", track.id, index + 1, `/music/${track.slug}`)
                        }
                        className="hover:bg-muted/50 flex items-center gap-3 px-4 py-3 transition-colors"
                      >
                        <div className="bg-muted relative h-10 w-10 flex-shrink-0 overflow-hidden rounded">
                          {track.coverArt ? (
                            <Image
                              src={track.coverArt}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            <div className="from-brand/10 to-muted flex h-full w-full items-center justify-center bg-gradient-to-br">
                              <Music className="text-muted-foreground/40 h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-foreground truncate text-sm font-semibold">
                            {track.title}
                          </p>
                          <p className="text-muted-foreground truncate text-xs">
                            {(track as MusicCardData & { artist?: string }).artist ?? ""}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Artists shelf */}
          {results.artists.length > 0 && (
            <ScrollShelf title="Artists">
              {results.artists.map((a) => (
                <ShelfItem key={a.id}>
                  <ArtistCard artist={a} />
                </ShelfItem>
              ))}
            </ScrollShelf>
          )}

          {/* More Songs grid */}
          {results.music.length > 4 && (
            <section>
              <h2 className="text-foreground mb-3 text-sm font-bold">More Songs</h2>
              <div className="grid grid-cols-2 gap-3 @sm:grid-cols-3 @xl:grid-cols-4">
                {results.music.slice(4).map((track) => (
                  <MusicShelfCard
                    key={track.id}
                    track={track as MusicCardData}
                    shelfTracks={results.music as MusicCardData[]}
                    shelfLabel="Search Results"
                  />
                ))}
              </div>
            </section>
          )}

          {/* News & Articles */}
          {results.posts.length > 0 && (
            <section>
              <h2 className="text-foreground mb-3 flex items-center gap-2 text-sm font-bold">
                <FileText className="text-muted-foreground h-4 w-4" />
                News &amp; Articles
              </h2>
              <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2 @xl:grid-cols-3">
                {results.posts.map((post, index) => (
                  <div
                    key={post.id}
                    onClick={() =>
                      trackSearchClick("POST", post.id, index + 1, post.href || `/${post.slug}`)
                    }
                    className="bg-card/50 ring-border/40 rounded-xl px-3 ring-1"
                  >
                    <PostCard post={post} variant="compact" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <Loader2 className="text-brand h-8 w-8 animate-spin" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
