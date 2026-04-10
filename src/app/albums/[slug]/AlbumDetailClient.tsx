"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, Pause, Music, Disc, Calendar, Clock, Download, Share2, Check } from "lucide-react";
import { usePlayerStore } from "@/store/player.store";
import type { Track } from "@/store/player.store";
import { HeartButton } from "@/components/music/HeartButton";
import { DownloadButton } from "@/components/music/DownloadButton";
import { ScrollShelf } from "@/components/music/ScrollShelf";
import { MusicShelfCard } from "@/components/music/MusicShelfCard";
import { Badge } from "@/components/ui/badge";
import { cn, formatDuration } from "@/lib/utils";
import type { MusicCardData } from "@/lib/api/music";

/* ─── Types ─── */

interface AlbumTrack {
  id: string;
  title: string;
  slug: string;
  r2Key: string;
  coverArt: string | null;
  duration: number | null;
  trackNumber: number | null;
  downloadCount: number;
  enableDownload: boolean;
}

interface AlbumDetailClientProps {
  album: {
    id: string;
    title: string;
    slug: string;
    coverArt: string | null;
    type: string;
    genre: string | null;
    label: string | null;
    releaseYear: number | null;
  };
  artist: {
    id: string;
    name: string;
    slug: string;
    photo: string | null;
  };
  tracks: AlbumTrack[];
  totalDuration: number;
  totalDownloads: number;
  moreByArtist: MusicCardData[];
  siteUrl: string;
}

/* ─── Equalizer mini bars ─── */

function EqualizerBarsMini({ className }: { className?: string }) {
  const bar = cn("w-[2px] rounded-full", className ?? "bg-brand");
  return (
    <div className="flex h-3 items-end gap-[2px]">
      <span className={cn(bar, "animate-[soundloaded-equalizer_0.4s_ease_infinite]")} />
      <span className={cn(bar, "animate-[soundloaded-equalizer_0.6s_ease_infinite_0.1s]")} />
      <span className={cn(bar, "animate-[soundloaded-equalizer_0.5s_ease_infinite_0.2s]")} />
    </div>
  );
}

/* ─── Main component ─── */

export function AlbumDetailClient({
  album,
  artist,
  tracks,
  totalDuration,
  totalDownloads,
  moreByArtist,
  siteUrl,
}: AlbumDetailClientProps) {
  const [shareCopied, setShareCopied] = useState(false);

  const { currentTrack, isPlaying, isBuffering, setTrack, setContextQueue, togglePlay } =
    usePlayerStore();

  const playerTracks: Track[] = tracks.map((t) => ({
    id: t.id,
    title: t.title,
    artist: artist.name,
    artistSlug: artist.slug,
    coverArt: t.coverArt ?? album.coverArt,
    r2Key: t.r2Key,
    duration: t.duration ?? 0,
    slug: t.slug,
  }));

  const handlePlayAll = () => {
    if (playerTracks.length === 0) return;
    const isAlbumPlaying =
      currentTrack && tracks.some((t) => t.id === currentTrack.id) && isPlaying;
    if (isAlbumPlaying) {
      togglePlay();
      return;
    }
    setContextQueue(playerTracks, album.title);
    setTrack(playerTracks[0]);
  };

  const handlePlayTrack = (index: number) => {
    if (currentTrack?.id === tracks[index].id) {
      togglePlay();
      return;
    }
    setContextQueue(playerTracks, album.title);
    setTrack(playerTracks[index]);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const handleShare = async () => {
    const url = `${siteUrl}/albums/${album.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${album.title} — ${artist.name}`, url });
        return;
      } catch {
        // fall through to copy
      }
    }
    await copyToClipboard(url);
  };

  const isAlbumPlaying = currentTrack && tracks.some((t) => t.id === currentTrack.id) && isPlaying;

  return (
    <div className="mx-auto max-w-4xl pb-24">
      {/* ── Hero section ── */}
      <div className="relative px-4 pt-8 pb-6 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
          {/* Cover art */}
          <div className="bg-muted relative aspect-square w-full flex-shrink-0 overflow-hidden rounded-2xl shadow-2xl sm:w-64">
            {album.coverArt ? (
              <Image
                src={album.coverArt}
                alt={album.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 640px) 100vw, 256px"
              />
            ) : (
              <div className="from-brand/10 to-muted flex h-full items-center justify-center bg-gradient-to-br">
                <Disc className="text-muted-foreground/30 h-16 w-16" />
              </div>
            )}
          </div>

          {/* Album info */}
          <div className="flex flex-1 flex-col justify-end space-y-3">
            <Badge className="bg-brand/15 text-brand border-brand/20 w-fit text-xs tracking-wide uppercase">
              {album.type}
            </Badge>

            <h1 className="text-foreground text-2xl font-black sm:text-3xl">{album.title}</h1>

            <Link href={`/artists/${artist.slug}`} className="flex items-center gap-2">
              {artist.photo && (
                <div className="relative h-6 w-6 overflow-hidden rounded-full">
                  <Image
                    src={artist.photo}
                    alt={artist.name}
                    fill
                    className="object-cover"
                    sizes="24px"
                  />
                </div>
              )}
              <span className="text-muted-foreground hover:text-brand text-sm font-medium transition-colors">
                {artist.name}
              </span>
            </Link>

            <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
              {album.releaseYear && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {album.releaseYear}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Music className="h-3.5 w-3.5" />
                {tracks.length} {tracks.length === 1 ? "track" : "tracks"}
              </span>
              {totalDuration > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDuration(totalDuration)}
                </span>
              )}
              {totalDownloads > 0 && (
                <span className="flex items-center gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  {totalDownloads.toLocaleString()}
                </span>
              )}
            </div>

            {album.genre && (
              <Badge variant="secondary" className="w-fit text-xs">
                {album.genre}
              </Badge>
            )}

            {/* Action row */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handlePlayAll}
                className="bg-brand text-brand-foreground hover:bg-brand/90 flex h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors"
              >
                {isAlbumPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="ml-0.5 h-4 w-4" />
                )}
                {isAlbumPlaying ? "Pause" : "Play All"}
              </button>

              <button
                type="button"
                onClick={handleShare}
                className={cn(
                  "flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
                  shareCopied
                    ? "border-brand/30 bg-brand/10 text-brand"
                    : "border-border text-foreground hover:bg-muted"
                )}
              >
                {shareCopied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                {shareCopied ? "Copied!" : "Share"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tracklist ── */}
      <div className="px-4 pt-2 sm:px-6">
        <h2 className="text-foreground mb-3 text-lg font-bold">Tracklist</h2>

        {tracks.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">No tracks uploaded yet.</p>
        ) : (
          <div className="space-y-0.5">
            {tracks.map((track, index) => {
              const isCurrentTrack = currentTrack?.id === track.id;
              const isActivelyPlaying = isCurrentTrack && isPlaying;
              const isTrackBuffering = isCurrentTrack && isPlaying && isBuffering;

              return (
                <div
                  key={track.id}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                    isCurrentTrack ? "bg-brand/5" : "hover:bg-muted/50"
                  )}
                >
                  {/* Track number / Play / Equalizer */}
                  <button
                    type="button"
                    onClick={() => handlePlayTrack(index)}
                    className="relative flex h-8 w-8 shrink-0 items-center justify-center"
                    aria-label={isActivelyPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
                  >
                    {isTrackBuffering ? (
                      <svg
                        className="text-brand h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="3"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    ) : isActivelyPlaying ? (
                      <EqualizerBarsMini />
                    ) : (
                      <>
                        <span className="text-muted-foreground text-sm font-medium tabular-nums group-hover:hidden">
                          {track.trackNumber ?? index + 1}
                        </span>
                        <Play className="text-foreground hidden h-4 w-4 group-hover:block" />
                      </>
                    )}
                  </button>

                  {/* Title + download count */}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/music/${track.slug}`}
                      className={cn(
                        "block truncate text-sm font-medium transition-colors hover:underline",
                        isCurrentTrack ? "text-brand" : "text-foreground"
                      )}
                    >
                      {track.title}
                    </Link>
                    {track.downloadCount > 0 && (
                      <span className="text-muted-foreground/60 text-[11px]">
                        {track.downloadCount.toLocaleString()} downloads
                      </span>
                    )}
                  </div>

                  {/* Right side: duration (always) + heart/download (hover) */}
                  <div className="flex items-center gap-1.5">
                    {/* Heart — always visible on mobile, hover on desktop */}
                    <div className="flex-shrink-0 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                      <HeartButton musicId={track.id} size={14} />
                    </div>

                    {/* Download — always visible on mobile, hover on desktop */}
                    {track.enableDownload && (
                      <div className="flex-shrink-0 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                        <DownloadButton
                          musicId={track.id}
                          title={track.title}
                          enabled={track.enableDownload}
                          size="sm"
                          variant="ghost"
                        />
                      </div>
                    )}

                    {/* Duration */}
                    {track.duration && (
                      <span className="text-muted-foreground w-10 flex-shrink-0 text-right text-xs tabular-nums">
                        {formatDuration(track.duration)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {tracks.length > 0 && (
          <p className="text-muted-foreground mt-4 text-xs">
            {tracks.length} {tracks.length === 1 ? "track" : "tracks"}
            {totalDuration > 0 && <> · {formatDuration(totalDuration)}</>}
            {totalDownloads > 0 && <> · {totalDownloads.toLocaleString()} downloads</>}
            {album.label && <> · {album.label}</>}
          </p>
        )}
      </div>

      {/* ── More by artist ── */}
      {moreByArtist.length > 0 && (
        <div className="mt-10 px-4 sm:px-6">
          <ScrollShelf title={`More by ${artist.name}`}>
            {moreByArtist.map((track) => (
              <div key={track.id} className="w-[150px] flex-shrink-0 sm:w-[170px]">
                <MusicShelfCard track={track} shelfTracks={moreByArtist} />
              </div>
            ))}
          </ScrollShelf>
        </div>
      )}
    </div>
  );
}
