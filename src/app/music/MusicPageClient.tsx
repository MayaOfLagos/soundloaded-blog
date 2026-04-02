"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Disc, Mic2, Music2 } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { GenreChips } from "@/components/music/GenreChips";
import { ScrollShelf, ShelfItem } from "@/components/music/ScrollShelf";
import { MusicShelfCard } from "@/components/music/MusicShelfCard";
import { MusicListItem } from "@/components/music/MusicListItem";
import { MorphingTitle } from "@/components/blog/MorphingTitle";
import { Badge } from "@/components/ui/badge";
import { PlaylistCard } from "@/components/music/PlaylistCard";
import type {
  MusicCardData,
  AlbumCardData,
  ArtistCardData,
  PublicPlaylistData,
} from "@/lib/api/music";
import type { PlaylistSummary } from "@/hooks/usePlaylist";

interface MusicPageClientProps {
  newReleases: MusicCardData[];
  trending: MusicCardData[];
  mostStreamed?: MusicCardData[];
  albums: AlbumCardData[];
  artists: ArtistCardData[];
  genres: string[];
  genreShelves: { genre: string; tracks: MusicCardData[] }[];
  playlists?: PublicPlaylistData[];
}

export function MusicPageClient({
  newReleases,
  trending,
  mostStreamed,
  albums,
  artists,
  genres,
  genreShelves,
  playlists,
}: MusicPageClientProps) {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  const filterTracks = (tracks: MusicCardData[]) =>
    selectedGenre ? tracks.filter((t) => t.genre === selectedGenre) : tracks;

  const filteredNewReleases = filterTracks(newReleases);
  const filteredTrending = filterTracks(trending);
  const showAllSections = selectedGenre === null;

  return (
    <div className="space-y-10">
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

      {/* ── Section 1: New Releases — GRID ── */}
      {filteredNewReleases.length > 0 && (
        <section>
          <SectionHeader
            titles={["New Releases", "Just Dropped", "Fresh Music", "Latest Drops"]}
            href="/music?sort=latest"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filteredNewReleases.slice(0, 12).map((track) => (
              <MusicShelfCard
                key={track.id}
                track={track}
                shelfTracks={filteredNewReleases}
                shelfLabel="New Releases"
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Section 2: Trending Now — SCROLL SHELF ── */}
      {filteredTrending.length > 0 && (
        <ScrollShelf
          title={
            <MorphingTitle
              titles={["Trending Now", "Hot Right Now", "What's Poppin", "Fire Tracks"]}
              className="text-xl font-bold"
              as="h2"
            />
          }
          href="/music?sort=popular"
        >
          {filteredTrending.map((track) => (
            <ShelfItem key={track.id}>
              <MusicShelfCard track={track} shelfTracks={filteredTrending} shelfLabel="Trending" />
            </ShelfItem>
          ))}
        </ScrollShelf>
      )}

      {/* ── Section 3: Most Streamed — LIST (chart) ── */}
      {showAllSections && mostStreamed && mostStreamed.length > 0 && (
        <section>
          <SectionHeader titles={["Most Streamed", "Top Charts", "Fan Favorites", "Hit Tracks"]} />
          <div className="divide-border/30 divide-y rounded-lg">
            {mostStreamed.slice(0, 10).map((track, i) => (
              <MusicListItem
                key={track.id}
                track={track}
                rank={i + 1}
                listTracks={mostStreamed}
                listLabel="Most Streamed"
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Section 4: Top Albums — GRID ── */}
      {showAllSections && albums.length > 0 && (
        <section>
          <SectionHeader titles={["Top Albums", "Album Picks", "Full Projects"]} href="/albums" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {albums.map((album) => (
              <AlbumShelfCard key={album.id} album={album} />
            ))}
          </div>
        </section>
      )}

      {/* ── Section 5: Rising Artists — SCROLL SHELF ── */}
      {showAllSections && artists.length > 0 && (
        <ScrollShelf
          title={
            <MorphingTitle
              titles={["Rising Artists", "New Voices", "Artists to Watch"]}
              className="text-xl font-bold"
              as="h2"
            />
          }
          href="/artists"
        >
          {artists.map((artist) => (
            <ShelfItem key={artist.id}>
              <ArtistShelfCard artist={artist} />
            </ShelfItem>
          ))}
        </ScrollShelf>
      )}

      {/* ── Section 6: Playlists — SCROLL SHELF ── */}
      {showAllSections && playlists && playlists.length > 0 && (
        <ScrollShelf
          title={
            <MorphingTitle
              titles={["Community Playlists", "Curated Collections", "Playlist Picks"]}
              className="text-xl font-bold"
              as="h2"
            />
          }
          href="/playlists"
        >
          {playlists.map((pl) => (
            <ShelfItem key={pl.id}>
              <PlaylistCard playlist={pl as unknown as PlaylistSummary} showCreator publicLink />
            </ShelfItem>
          ))}
        </ScrollShelf>
      )}

      {/* ── Section 7: Genre shelves — SCROLL SHELF per genre ── */}
      {showAllSections &&
        genreShelves.map(({ genre, tracks }) => (
          <ScrollShelf key={genre} title={genre}>
            {tracks.map((track) => (
              <ShelfItem key={track.id}>
                <MusicShelfCard track={track} shelfTracks={tracks} shelfLabel={genre} />
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

// ── Section header with MorphingTitle + "Show all" link ──
function SectionHeader({ titles, href }: { titles: string[]; href?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between px-1">
      <MorphingTitle titles={titles} className="text-xl font-bold" as="h2" />
      {href && (
        <Link
          href={href}
          className="text-muted-foreground hover:text-foreground text-sm font-semibold transition-colors"
        >
          Show all
        </Link>
      )}
    </div>
  );
}

// ── Album card adapted for grid layout ──
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
