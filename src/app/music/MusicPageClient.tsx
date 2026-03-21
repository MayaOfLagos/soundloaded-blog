"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Disc, Mic2, Music2 } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { GenreChips } from "@/components/music/GenreChips";
import { ScrollShelf, ShelfItem } from "@/components/music/ScrollShelf";
import { MusicShelfCard } from "@/components/music/MusicShelfCard";
import { Badge } from "@/components/ui/badge";
import type { MusicCardData, AlbumCardData, ArtistCardData } from "@/lib/api/music";

interface MusicPageClientProps {
  newReleases: MusicCardData[];
  trending: MusicCardData[];
  albums: AlbumCardData[];
  artists: ArtistCardData[];
  genres: string[];
  genreShelves: { genre: string; tracks: MusicCardData[] }[];
}

export function MusicPageClient({
  newReleases,
  trending,
  albums,
  artists,
  genres,
  genreShelves,
}: MusicPageClientProps) {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  // Filter track shelves by genre when a chip is selected
  const filterTracks = (tracks: MusicCardData[]) =>
    selectedGenre ? tracks.filter((t) => t.genre === selectedGenre) : tracks;

  const filteredNewReleases = filterTracks(newReleases);
  const filteredTrending = filterTracks(trending);

  // When a genre is selected, hide album/artist/genre shelves (show only filtered tracks)
  const showAllSections = selectedGenre === null;

  return (
    <div className="space-y-8">
      {/* Genre filter chips */}
      {genres.length > 0 && (
        <div className="border-border/40 bg-background/95 sticky top-14 z-30 -mx-4 border-b px-4 backdrop-blur-sm sm:-mx-6 sm:px-6">
          <GenreChips genres={genres} onChange={setSelectedGenre} />
        </div>
      )}

      {/* Hero heading */}
      <div>
        <h1 className="text-foreground text-3xl font-black tracking-tight sm:text-4xl">
          {selectedGenre ?? "Music"}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Stream and download the latest Afrobeats, Afropop, and Nigerian music.
        </p>
      </div>

      {/* New Releases */}
      {filteredNewReleases.length > 0 && (
        <ScrollShelf title="New Releases" href="/music?sort=latest">
          {filteredNewReleases.map((track) => (
            <ShelfItem key={track.id}>
              <MusicShelfCard track={track} shelfTracks={filteredNewReleases} />
            </ShelfItem>
          ))}
        </ScrollShelf>
      )}

      {/* Trending Now */}
      {filteredTrending.length > 0 && (
        <ScrollShelf title="Trending Now" href="/music?sort=popular">
          {filteredTrending.map((track) => (
            <ShelfItem key={track.id}>
              <MusicShelfCard track={track} shelfTracks={filteredTrending} />
            </ShelfItem>
          ))}
        </ScrollShelf>
      )}

      {/* Albums */}
      {showAllSections && albums.length > 0 && (
        <ScrollShelf title="Albums" href="/albums">
          {albums.map((album) => (
            <ShelfItem key={album.id}>
              <AlbumShelfCard album={album} />
            </ShelfItem>
          ))}
        </ScrollShelf>
      )}

      {/* Artists */}
      {showAllSections && artists.length > 0 && (
        <ScrollShelf title="Artists" href="/artists">
          {artists.map((artist) => (
            <ShelfItem key={artist.id}>
              <ArtistShelfCard artist={artist} />
            </ShelfItem>
          ))}
        </ScrollShelf>
      )}

      {/* Genre shelves */}
      {showAllSections &&
        genreShelves.map(({ genre, tracks }) => (
          <ScrollShelf key={genre} title={genre}>
            {tracks.map((track) => (
              <ShelfItem key={track.id}>
                <MusicShelfCard track={track} shelfTracks={tracks} />
              </ShelfItem>
            ))}
          </ScrollShelf>
        ))}

      {/* No results for filtered genre */}
      {selectedGenre && filteredNewReleases.length === 0 && filteredTrending.length === 0 && (
        <EmptyState
          icon={Music2}
          title={`No ${selectedGenre} tracks yet`}
          description={`New ${selectedGenre} music will appear here. Check back soon for fresh releases!`}
        />
      )}
    </div>
  );
}

// ── Album card adapted for shelf layout ──
function AlbumShelfCard({ album }: { album: AlbumCardData }) {
  return (
    <div className="group/card hover:bg-muted/50 rounded-lg p-3 transition-colors">
      <Link href={`/albums/${album.slug}`}>
        <div className="relative aspect-square overflow-hidden rounded-md">
          {album.coverArt ? (
            <Image
              src={album.coverArt}
              alt={album.title}
              fill
              className="object-cover transition-transform duration-300 group-hover/card:scale-105"
              sizes="(max-width: 640px) 150px, (max-width: 1024px) 180px, 200px"
            />
          ) : (
            <div className="from-brand/10 to-muted flex h-full items-center justify-center bg-gradient-to-br">
              <Disc className="text-muted-foreground/40 h-10 w-10" />
            </div>
          )}
        </div>
      </Link>
      <div className="mt-2 min-w-0">
        <Link href={`/albums/${album.slug}`}>
          <p className="text-foreground group-hover/card:text-brand truncate text-sm font-bold transition-colors">
            {album.title}
          </p>
        </Link>
        <Link
          href={`/artists/${album.artistSlug}`}
          className="text-muted-foreground hover:text-brand mt-0.5 block truncate text-xs transition-colors"
        >
          {album.artistName}
        </Link>
        <div className="text-muted-foreground mt-1 flex items-center gap-2 text-[11px]">
          <Badge variant="secondary" className="py-0 text-[10px]">
            {album.releaseYear ?? "N/A"}
          </Badge>
          <span>{album.trackCount} tracks</span>
        </div>
      </div>
    </div>
  );
}

// ── Artist card adapted for shelf layout ──
function ArtistShelfCard({ artist }: { artist: ArtistCardData }) {
  return (
    <Link
      href={`/artists/${artist.slug}`}
      className="group/card hover:bg-muted/50 flex flex-col items-center rounded-lg p-3 text-center transition-colors"
    >
      <div className="relative mb-2 h-[140px] w-[140px] overflow-hidden rounded-full sm:h-[160px] sm:w-[160px]">
        {artist.photo ? (
          <Image
            src={artist.photo}
            alt={artist.name}
            fill
            className="object-cover transition-transform duration-300 group-hover/card:scale-105"
            sizes="160px"
          />
        ) : (
          <div className="from-brand/10 to-muted flex h-full w-full items-center justify-center bg-gradient-to-br">
            <Mic2 className="text-muted-foreground/40 h-10 w-10" />
          </div>
        )}
      </div>
      <p className="text-foreground group-hover/card:text-brand truncate text-sm font-bold transition-colors">
        {artist.name}
      </p>
      {artist.genre && (
        <Badge variant="secondary" className="mt-1 text-[10px]">
          {artist.genre}
        </Badge>
      )}
      <p className="text-muted-foreground mt-0.5 text-xs">
        {artist.songCount} song{artist.songCount !== 1 ? "s" : ""}
      </p>
    </Link>
  );
}
