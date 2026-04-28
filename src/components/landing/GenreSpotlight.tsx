import Link from "next/link";
import { ArrowRight, Disc3 } from "lucide-react";

type GenreTile = {
  name: string;
  /** Tailwind gradient classes (from / via / to). */
  gradient: string;
  /** Decorative tagline shown faintly behind the genre name. */
  caption: string;
};

// Curated palette — covers the dominant Naija genres
const GENRE_TILES: GenreTile[] = [
  {
    name: "Afrobeats",
    gradient: "from-fuchsia-500 via-purple-600 to-indigo-900",
    caption: "The wave",
  },
  { name: "Amapiano", gradient: "from-cyan-400 via-teal-600 to-emerald-900", caption: "Log drum" },
  { name: "Highlife", gradient: "from-amber-400 via-orange-600 to-red-900", caption: "Old school" },
  { name: "Gospel", gradient: "from-sky-400 via-blue-600 to-indigo-900", caption: "Praise sound" },
  {
    name: "Hip Hop",
    gradient: "from-slate-500 via-zinc-700 to-neutral-900",
    caption: "Bars & flow",
  },
  { name: "R&B", gradient: "from-rose-400 via-pink-600 to-fuchsia-900", caption: "After dark" },
];

export function GenreSpotlight({ availableGenres }: { availableGenres: string[] }) {
  // Lower-case set for case-insensitive match against DB genres
  const available = new Set(availableGenres.map((g) => g.toLowerCase()));

  // Show all curated tiles by default; if any have matching content,
  // mark them as "live". This avoids an empty section on a fresh DB.
  const tiles = GENRE_TILES;

  return (
    <section className="bg-foreground/3 py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-brand mb-1 flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
              <Disc3 className="h-4 w-4" />
              Browse by Vibe
            </div>
            <h2 className="text-2xl font-black sm:text-3xl">Pick Your Sound</h2>
          </div>
          <Link
            href="/music"
            className="text-brand hover:text-brand/80 mb-1 flex shrink-0 items-center gap-1 text-sm font-semibold transition-colors"
          >
            All Genres
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
          {tiles.map((tile) => {
            const isLive = available.has(tile.name.toLowerCase());
            return (
              <Link
                key={tile.name}
                href={`/music?genre=${encodeURIComponent(tile.name)}`}
                className={`group relative aspect-[4/5] overflow-hidden rounded-2xl bg-linear-to-br ${tile.gradient} ring-1 ring-white/10 transition-all duration-300 hover:scale-[1.03] hover:ring-white/40`}
              >
                {/* Soft inner shadow + sheen */}
                <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_60%)]" />

                {/* Subtle big-text caption behind */}
                <span className="pointer-events-none absolute -right-2 -bottom-2 text-5xl font-black tracking-tight text-white/10 select-none sm:text-6xl">
                  {tile.caption}
                </span>

                <div className="relative flex h-full flex-col justify-end p-4">
                  {isLive && (
                    <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-bold tracking-wider text-white/90 uppercase backdrop-blur-md">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Live
                    </span>
                  )}
                  <h3 className="text-lg leading-tight font-black text-white drop-shadow-md sm:text-xl">
                    {tile.name}
                  </h3>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
