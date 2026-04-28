import Link from "next/link";
import { ArrowRight, Mic2 } from "lucide-react";
import { ArtistCard } from "@/components/music/ArtistCard";
import type { ArtistCardData } from "@/lib/api/music";

export function FeaturedArtists({ artists }: { artists: ArtistCardData[] }) {
  if (artists.length === 0) return null;

  return (
    <section className="bg-foreground/3 py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-brand mb-1 flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
              <Mic2 className="h-4 w-4" />
              Naija Voices
            </div>
            <h2 className="text-2xl font-black sm:text-3xl">Featured Artists</h2>
          </div>
          <Link
            href="/artists"
            className="text-brand hover:text-brand/80 mb-1 flex shrink-0 items-center gap-1 text-sm font-semibold transition-colors"
          >
            All Artists
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {artists.slice(0, 6).map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>
      </div>
    </section>
  );
}
