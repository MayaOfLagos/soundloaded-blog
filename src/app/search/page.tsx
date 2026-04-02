"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Loader2, FileText, Music, Mic2, AlertCircle } from "lucide-react";
import { PostCard, type PostCardData } from "@/components/blog/PostCard";
import { MusicCard } from "@/components/music/MusicCard";
import { ArtistCard } from "@/components/music/ArtistCard";
import { GenreBrowseCard } from "@/components/music/GenreBrowseCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BROWSE_CATEGORIES, BROWSE_GENRES, getGenreGradient } from "@/lib/genre-colors";
import type { MusicCardData, ArtistCardData } from "@/lib/api/music";

interface SearchResults {
  posts: PostCardData[];
  music: MusicCardData[];
  artists: ArtistCardData[];
}

const POPULAR_SEARCHES = ["Burna Boy", "Afrobeats", "Wizkid", "Amapiano", "Davido", "Asake"];

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") ?? "";
  const [inputValue, setInputValue] = useState(q);
  const [results, setResults] = useState<SearchResults>({ posts: [], music: [], artists: [] });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setInputValue(q);
    if (!q || q.length < 2) {
      setResults({ posts: [], music: [], artists: [] });
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setHasSearched(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}&full=1`)
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
  /* eslint-enable react-hooks/set-state-in-effect */

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

  const total = results.posts.length + results.music.length + results.artists.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header + Search Input */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Search className="text-brand h-5 w-5" />
          <h1 className="text-foreground text-2xl font-black">
            {q ? (
              <>
                Results for <span className="text-brand">&ldquo;{q}&rdquo;</span>
              </>
            ) : (
              "Search"
            )}
          </h1>
        </div>

        {/* Search form */}
        <form onSubmit={handleSubmit} className="flex max-w-xl gap-2">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search music, news, artists..."
              className="bg-card pl-9"
              autoFocus={!q}
            />
          </div>
          <Button
            type="submit"
            className="bg-brand hover:bg-brand/90 text-brand-foreground"
            disabled={inputValue.trim().length < 2}
          >
            Search
          </Button>
        </form>

        {q && !loading && (
          <p className="text-muted-foreground mt-2 text-sm">
            {total === 0 ? "No results found" : `${total} result${total !== 1 ? "s" : ""} found`}
          </p>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="text-brand h-8 w-8 animate-spin" />
        </div>
      )}

      {/* No query — browse all */}
      {!loading && !q && (
        <div>
          {/* Popular searches */}
          <div className="mb-8 flex flex-wrap items-center gap-2">
            {POPULAR_SEARCHES.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => handleSuggestion(term)}
                className="bg-muted text-muted-foreground hover:bg-brand/10 hover:text-brand rounded-full px-4 py-2 text-sm font-medium transition-colors"
              >
                {term}
              </button>
            ))}
          </div>

          {/* Browse All */}
          <h2 className="text-foreground mb-4 text-xl font-bold">Browse All</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {/* Special categories first */}
            {BROWSE_CATEGORIES.map((cat) => (
              <GenreBrowseCard
                key={cat.label}
                label={cat.label}
                href={cat.href}
                gradient={cat.bg}
              />
            ))}
            {/* Genre cards */}
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
              <a key={href} href={href} className="text-brand font-medium hover:underline">
                {label}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && total > 0 && (
        <Tabs defaultValue="all">
          <TabsList className="bg-muted mb-6">
            <TabsTrigger value="all" className="text-sm">
              All
              <span className="ml-1.5 text-xs opacity-70">({total})</span>
            </TabsTrigger>
            {results.posts.length > 0 && (
              <TabsTrigger value="posts" className="gap-1.5 text-sm">
                <FileText className="h-3.5 w-3.5" />
                News
                <span className="text-xs opacity-70">({results.posts.length})</span>
              </TabsTrigger>
            )}
            {results.music.length > 0 && (
              <TabsTrigger value="music" className="gap-1.5 text-sm">
                <Music className="h-3.5 w-3.5" />
                Music
                <span className="text-xs opacity-70">({results.music.length})</span>
              </TabsTrigger>
            )}
            {results.artists.length > 0 && (
              <TabsTrigger value="artists" className="gap-1.5 text-sm">
                <Mic2 className="h-3.5 w-3.5" />
                Artists
                <span className="text-xs opacity-70">({results.artists.length})</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* All tab */}
          <TabsContent value="all" className="space-y-6">
            {results.posts.length > 0 && (
              <section>
                <h2 className="text-foreground mb-2 flex items-center gap-2 text-sm font-bold">
                  <FileText className="text-muted-foreground h-4 w-4" />
                  News &amp; Articles
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {results.posts.map((post) => (
                    <div key={post.id} className="bg-card/50 ring-border/40 rounded-xl px-3 ring-1">
                      <PostCard post={post} variant="compact" />
                    </div>
                  ))}
                </div>
              </section>
            )}
            {results.music.length > 0 && (
              <section>
                <h2 className="text-foreground mb-2 flex items-center gap-2 text-sm font-bold">
                  <Music className="text-muted-foreground h-4 w-4" />
                  Music
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {results.music.map((track) => (
                    <MusicCard key={track.id} track={track} />
                  ))}
                </div>
              </section>
            )}
            {results.artists.length > 0 && (
              <section>
                <h2 className="text-foreground mb-2 flex items-center gap-2 text-sm font-bold">
                  <Mic2 className="text-muted-foreground h-4 w-4" />
                  Artists
                </h2>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {results.artists.map((a) => (
                    <ArtistCard key={a.id} artist={a} />
                  ))}
                </div>
              </section>
            )}
          </TabsContent>

          {/* News tab */}
          <TabsContent value="posts">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {results.posts.map((post) => (
                <PostCard key={post.id} post={post} hideExcerpt />
              ))}
            </div>
          </TabsContent>

          {/* Music tab */}
          <TabsContent value="music">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {results.music.map((track) => (
                <MusicCard key={track.id} track={track} />
              ))}
            </div>
          </TabsContent>

          {/* Artists tab */}
          <TabsContent value="artists">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {results.artists.map((a) => (
                <ArtistCard key={a.id} artist={a} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
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
