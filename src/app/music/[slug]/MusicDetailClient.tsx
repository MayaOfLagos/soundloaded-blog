"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Music2, Calendar, Disc, Clock, HardDrive, FileAudio, Tag, Building } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { TrackStatsBar } from "@/components/music/TrackStatsBar";
import { TrackActionBar } from "@/components/music/TrackActionBar";
import { AlbumTracklist } from "@/components/music/AlbumTracklist";
import { ArtistInfoCard } from "@/components/music/ArtistInfoCard";
import { ScrollShelf, ShelfItem } from "@/components/music/ScrollShelf";
import { MusicShelfCard } from "@/components/music/MusicShelfCard";
import { CommentSection } from "@/components/blog/CommentSection";
import { PostBody } from "@/components/blog/PostBody";
import { formatDuration, formatFileSize } from "@/lib/utils";
import type { MusicCardData } from "@/lib/api/music";

interface TrackDetail {
  id: string;
  title: string;
  slug: string;
  r2Key: string;
  coverArt: string | null;
  genre: string | null;
  year: number | null;
  label: string | null;
  format: string;
  bitrate: number | null;
  duration: number | null;
  fileSize: number | null; // converted from BigInt in server component
  downloadCount: number;
  streamCount: number;
  enableDownload: boolean;
  isExclusive: boolean;
  price: number | null;
  trackNumber: number | null;
  postId: string;
  artist: {
    name: string;
    slug: string;
    photo: string | null;
    bio: string | null;
    country: string | null;
    genre: string | null;
    instagram: string | null;
    twitter: string | null;
    facebook: string | null;
    spotify: string | null;
    appleMusic: string | null;
  };
  album: {
    title: string;
    slug: string;
    tracks: {
      id: string;
      title: string;
      slug: string;
      r2Key: string;
      coverArt: string | null;
      duration: number | null;
      trackNumber: number | null;
      enableDownload: boolean;
    }[];
  } | null;
}

interface MusicDetailClientProps {
  track: TrackDetail;
  description?: unknown;
  dominantColor: { r: number; g: number; b: number } | null;
  moreByArtist: MusicCardData[];
  relatedTracks: MusicCardData[];
  favoriteCount: number;
  settings: {
    enableComments: boolean;
    enableDownloads: boolean;
    enableAlbums: boolean;
    enableArtists: boolean;
    requireLoginToComment: boolean;
    commentNestingDepth: number;
    siteUrl: string;
  };
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-muted/70 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
        <Icon className="text-muted-foreground h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground/70 text-[11px] leading-none tracking-wider uppercase">
          {label}
        </p>
        <p className="text-foreground mt-0.5 truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function DescriptionSection({
  description,
  trackTitle,
}: {
  description: unknown;
  trackTitle: string;
}) {
  const [showFull, setShowFull] = useState(false);

  return (
    <>
      <div className="mt-6 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => setShowFull(true)}
          className="bg-card/50 ring-border/40 hover:bg-card/70 w-full rounded-xl p-4 text-left ring-1 backdrop-blur-sm transition-colors"
        >
          <p className="text-foreground mb-1 text-sm font-semibold">About this track</p>
          <div className="text-muted-foreground line-clamp-1 text-sm">
            <PostBody body={description} />
          </div>
          <span className="text-brand mt-1.5 inline-block text-xs font-semibold">See more</span>
        </button>
      </div>

      <Dialog open={showFull} onOpenChange={setShowFull}>
        <DialogPortal>
          <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" />
          <DialogPrimitive.Content className="bg-background border-border data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed right-3 bottom-3 left-3 z-50 max-h-[85vh] overflow-y-auto rounded-2xl border shadow-2xl duration-200 sm:inset-auto sm:top-[50%] sm:left-[50%] sm:max-h-[80vh] sm:w-full sm:max-w-2xl sm:translate-x-[-50%] sm:translate-y-[-50%]">
            <div className="border-border bg-background/95 sticky top-0 z-10 flex items-center justify-between border-b px-5 py-4 backdrop-blur-sm">
              <DialogTitle className="text-lg font-semibold">About {trackTitle}</DialogTitle>
              <DialogPrimitive.Close className="bg-muted hover:bg-muted/80 text-foreground flex h-8 w-8 items-center justify-center rounded-full transition-colors">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            </div>
            <div className="px-5 py-5">
              <PostBody body={description} />
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </>
  );
}

function hasContent(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.content)) return false;
  return (
    b.content.length > 0 &&
    !(
      b.content.length === 1 &&
      (b.content[0] as Record<string, unknown>)?.type === "paragraph" &&
      !(b.content[0] as Record<string, unknown>)?.content
    )
  );
}

export function MusicDetailClient({
  track,
  description,
  dominantColor,
  moreByArtist,
  relatedTracks,
  favoriteCount,
  settings,
}: MusicDetailClientProps) {
  const dc = dominantColor ?? { r: 220, g: 38, b: 38 }; // fallback to red-ish brand

  const moreByArtistCards: MusicCardData[] = moreByArtist;
  const relatedCards: MusicCardData[] = relatedTracks;

  return (
    <div className="mx-auto max-w-4xl pb-24">
      {/* ── Hero section with dynamic gradient ── */}
      <div
        className="relative px-4 pt-8 pb-6 sm:px-6"
        style={{
          background: `linear-gradient(to bottom, rgba(${dc.r},${dc.g},${dc.b},0.35) 0%, transparent 100%)`,
        }}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
          {/* Cover art */}
          <div className="relative aspect-square w-full flex-shrink-0 overflow-hidden rounded-2xl shadow-2xl sm:w-72">
            {track.coverArt ? (
              <Image
                src={track.coverArt}
                alt={track.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 640px) 100vw, 288px"
              />
            ) : (
              <div className="from-brand/20 to-muted flex h-full w-full items-center justify-center bg-gradient-to-br">
                <Music2 className="text-muted-foreground/30 h-20 w-20" />
              </div>
            )}
          </div>

          {/* Track info */}
          <div className="flex flex-1 flex-col justify-end space-y-3">
            {track.genre && (
              <Badge className="bg-brand/15 text-brand border-brand/20 w-fit text-xs tracking-wide uppercase">
                {track.genre}
              </Badge>
            )}

            <div>
              <h1 className="text-foreground text-2xl leading-tight font-black sm:text-3xl lg:text-4xl">
                {track.title}
              </h1>
              {settings.enableArtists ? (
                <Link
                  href={`/artists/${track.artist.slug}`}
                  className="text-muted-foreground hover:text-foreground mt-1 block text-lg font-medium transition-colors hover:underline"
                >
                  {track.artist.name}
                </Link>
              ) : (
                <p className="text-muted-foreground mt-1 text-lg font-medium">
                  {track.artist.name}
                </p>
              )}
            </div>

            {/* Stats bar */}
            <TrackStatsBar
              streamCount={track.streamCount}
              downloadCount={track.downloadCount}
              favoriteCount={favoriteCount}
            />

            {/* Action buttons */}
            <TrackActionBar
              track={{
                id: track.id,
                title: track.title,
                slug: track.slug,
                r2Key: track.r2Key,
                coverArt: track.coverArt,
                duration: track.duration,
                enableDownload: track.enableDownload,
                isExclusive: track.isExclusive,
                price: track.price,
                artistName: track.artist.name,
                genre: track.genre,
                downloadCount: track.downloadCount,
                fileSize: track.fileSize,
                releaseYear: track.year,
                albumTitle: track.album?.title ?? null,
              }}
              siteUrl={settings.siteUrl}
              enableDownloads={settings.enableDownloads}
            />
          </div>
        </div>
      </div>

      {/* ── Track details grid ── */}
      <div className="mt-6 px-4 sm:px-6">
        <div className="bg-card/50 ring-border/40 rounded-xl p-4 ring-1 backdrop-blur-sm sm:p-5">
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            <DetailItem
              icon={FileAudio}
              label="Format"
              value={`${track.format.toUpperCase()}${track.bitrate ? ` ${track.bitrate}kbps` : ""}`}
            />
            {track.duration && (
              <DetailItem icon={Clock} label="Duration" value={formatDuration(track.duration)} />
            )}
            {track.fileSize && (
              <DetailItem icon={HardDrive} label="Size" value={formatFileSize(track.fileSize)} />
            )}
            {track.year && <DetailItem icon={Calendar} label="Year" value={String(track.year)} />}
            {track.genre && <DetailItem icon={Tag} label="Genre" value={track.genre} />}
            {track.album && <DetailItem icon={Disc} label="Album" value={track.album.title} />}
            {track.label && <DetailItem icon={Building} label="Label" value={track.label} />}
          </div>
        </div>
      </div>

      {/* ── Description ── */}
      {hasContent(description) ? (
        <DescriptionSection description={description} trackTitle={track.title} />
      ) : null}

      {/* ── Album tracklist ── */}
      {track.album && track.album.tracks.length > 1 && (
        <div className="mt-8 px-4 sm:px-6">
          <AlbumTracklist
            tracks={track.album.tracks}
            currentTrackId={track.id}
            albumTitle={track.album.title}
            artistName={track.artist.name}
            albumSlug={track.album.slug}
          />
        </div>
      )}

      {/* ── More from artist ── */}
      {moreByArtistCards.length > 0 && settings.enableArtists && (
        <div className="mt-8 px-4 sm:px-6">
          <Separator className="mb-6" />
          <ScrollShelf
            title={`More from ${track.artist.name}`}
            href={`/artists/${track.artist.slug}`}
          >
            {moreByArtistCards.map((t) => (
              <ShelfItem key={t.id}>
                <MusicShelfCard track={t} shelfTracks={moreByArtistCards} />
              </ShelfItem>
            ))}
          </ScrollShelf>
        </div>
      )}

      {/* ── Artist info card ── */}
      {settings.enableArtists && (
        <div className="mt-8 px-4 sm:px-6">
          <ArtistInfoCard artist={track.artist} songCount={moreByArtistCards.length + 1} />
        </div>
      )}

      {/* ── Related tracks (You May Also Like) ── */}
      {relatedCards.length > 0 && (
        <div className="mt-8 px-4 sm:px-6">
          <Separator className="mb-6" />
          <ScrollShelf title="You May Also Like">
            {relatedCards.map((t) => (
              <ShelfItem key={t.id}>
                <MusicShelfCard track={t} shelfTracks={relatedCards} />
              </ShelfItem>
            ))}
          </ScrollShelf>
        </div>
      )}

      {/* ── Lyrics placeholder ── */}
      <div className="mt-8 px-4 sm:px-6">
        <Separator className="mb-6" />
        <h2 className="text-foreground mb-3 text-lg font-bold">Lyrics</h2>
        <p className="text-muted-foreground text-sm italic">
          Lyrics not yet available for this track.
        </p>
      </div>

      {/* ── Comments ── */}
      {settings.enableComments && (
        <div className="mt-8 px-4 sm:px-6">
          <Separator className="mb-6" />
          <CommentSection
            postId={track.postId}
            enableComments={settings.enableComments}
            requireLoginToComment={settings.requireLoginToComment}
            commentNestingDepth={settings.commentNestingDepth}
          />
        </div>
      )}
    </div>
  );
}
