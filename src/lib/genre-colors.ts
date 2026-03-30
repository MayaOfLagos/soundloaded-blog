export interface BrowseCategory {
  label: string;
  href: string;
  bg: string;
  icon?: string;
}

export const GENRE_COLORS: Record<string, string> = {
  Afrobeats: "from-green-500 to-green-700",
  Amapiano: "from-purple-500 to-purple-700",
  Gospel: "from-yellow-400 to-orange-500",
  "Hip Hop": "from-red-500 to-red-700",
  "R&B": "from-pink-500 to-rose-600",
  Fuji: "from-teal-500 to-teal-700",
  Highlife: "from-amber-500 to-amber-700",
  Afropop: "from-blue-500 to-blue-700",
  Reggae: "from-emerald-500 to-lime-600",
  Pop: "from-indigo-500 to-violet-600",
  Dancehall: "from-orange-500 to-red-500",
  Rap: "from-gray-700 to-gray-900",
  Jazz: "from-cyan-600 to-blue-800",
  Afro: "from-lime-500 to-green-600",
  Soul: "from-fuchsia-500 to-purple-700",
};

export const DEFAULT_GENRE_BG = "from-slate-500 to-slate-700";

export function getGenreGradient(genre: string): string {
  return GENRE_COLORS[genre] ?? DEFAULT_GENRE_BG;
}

// Special browse categories shown before genres
export const BROWSE_CATEGORIES: BrowseCategory[] = [
  { label: "New Releases", href: "/music?sort=latest", bg: "from-brand to-rose-600" },
  { label: "Trending", href: "/music?sort=popular", bg: "from-orange-500 to-red-600" },
  { label: "Playlists", href: "/playlists", bg: "from-violet-500 to-purple-700" },
  { label: "Artists", href: "/artists", bg: "from-sky-500 to-blue-700" },
  { label: "Albums", href: "/albums", bg: "from-emerald-500 to-teal-700" },
];

// Genre list for browse grid
export const BROWSE_GENRES = [
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
