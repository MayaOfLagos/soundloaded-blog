"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Play,
  Shuffle,
  Share2,
  Trash2,
  Music,
  ListMusic,
  Loader2,
  MoreHorizontal,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  usePlaylist,
  useDeletePlaylist,
  useRemoveTrackFromPlaylist,
  useReorderPlaylistTracks,
} from "@/hooks/usePlaylist";
import { usePlayerStore } from "@/store/player.store";
import { useDominantColor } from "@/hooks/useDominantColor";
import { HeartButton } from "@/components/music/HeartButton";
import { formatDuration } from "@/lib/utils";
import { notify } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import type { Track } from "@/store/player.store";
import type { PlaylistTrackItem } from "@/hooks/usePlaylist";

interface PlaylistDetailClientProps {
  playlistId: string;
}

function toPlayerTrack(t: PlaylistTrackItem): Track {
  return {
    id: t.music.id,
    title: t.music.title,
    artist: t.music.artist.name,
    artistSlug: t.music.artist.slug,
    coverArt: t.music.coverArt,
    r2Key: t.music.r2Key,
    duration: t.music.duration ?? 0,
    slug: t.music.slug,
  };
}

export function PlaylistDetailClient({ playlistId }: PlaylistDetailClientProps) {
  const router = useRouter();
  const { data, isLoading } = usePlaylist(playlistId);
  const deletePlaylist = useDeletePlaylist();
  const removeTrack = useRemoveTrackFromPlaylist();
  const { currentTrack, isPlaying, setTrack, setContextQueue, togglePlay } = usePlayerStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const playlist = data?.playlist;
  const isOwner = data?.isOwner ?? false;

  const firstCover = playlist?.tracks[0]?.music.coverArt ?? null;
  const dominantColor = useDominantColor(firstCover);

  const totalDuration = playlist?.tracks.reduce((acc, t) => acc + (t.music.duration ?? 0), 0) ?? 0;

  const handlePlayAll = useCallback(() => {
    if (!playlist?.tracks.length) return;
    const playerTracks = playlist.tracks.map(toPlayerTrack);
    setContextQueue(playerTracks, playlist.title);
    setTrack(playerTracks[0]);
  }, [playlist, setContextQueue, setTrack]);

  const handleShufflePlay = useCallback(() => {
    if (!playlist?.tracks.length) return;
    const playerTracks = playlist.tracks.map(toPlayerTrack);
    const shuffled = [...playerTracks].sort(() => Math.random() - 0.5);
    setContextQueue(shuffled, playlist.title);
    setTrack(shuffled[0]);
  }, [playlist, setContextQueue, setTrack]);

  const handleDelete = () => {
    deletePlaylist.mutate(playlistId, {
      onSuccess: () => router.push("/library/playlists"),
    });
  };

  const handleShare = () => {
    const url = `${window.location.origin}/library/playlists/${playlistId}`;
    if (navigator.share) {
      navigator.share({ title: playlist?.title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => notify.success("Link copied!"));
    }
  };

  const handleRemoveTrack = (trackId: string) => {
    removeTrack.mutate({ playlistId, trackId });
  };

  const handlePlayTrack = (item: PlaylistTrackItem) => {
    if (!playlist) return;
    const isCurrentTrack = currentTrack?.id === item.music.id;
    if (isCurrentTrack) {
      togglePlay();
      return;
    }
    const playerTracks = playlist.tracks.map(toPlayerTrack);
    setContextQueue(playerTracks, playlist.title);
    setTrack(toPlayerTrack(item));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <ListMusic className="text-muted-foreground/40 mb-4 h-16 w-16" />
        <h2 className="text-foreground text-lg font-semibold">Playlist not found</h2>
        <Link href="/library/playlists" className="text-brand mt-2 text-sm hover:underline">
          Back to playlists
        </Link>
      </div>
    );
  }

  const gradientBg = dominantColor
    ? `linear-gradient(to bottom, rgb(${dominantColor}) 0%, transparent 100%)`
    : undefined;

  const covers = playlist.tracks
    .map((t) => t.music.coverArt)
    .filter(Boolean)
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header with gradient */}
      <div
        className="relative overflow-hidden px-4 pt-8 pb-6 sm:px-6"
        style={gradientBg ? { background: gradientBg } : undefined}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
          {/* Playlist cover */}
          <div className="bg-muted relative h-48 w-48 flex-shrink-0 self-center overflow-hidden rounded-lg shadow-xl sm:self-auto">
            {playlist.coverImage ? (
              <Image src={playlist.coverImage} alt={playlist.title} fill className="object-cover" />
            ) : covers.length >= 4 ? (
              <div className="grid h-full w-full grid-cols-2 grid-rows-2">
                {covers.map((src, i) => (
                  <div key={i} className="relative overflow-hidden">
                    <Image src={src!} alt="" fill className="object-cover" sizes="120px" />
                  </div>
                ))}
              </div>
            ) : covers.length > 0 ? (
              <Image src={covers[0]!} alt={playlist.title} fill className="object-cover" />
            ) : (
              <div className="from-brand/20 to-muted flex h-full w-full items-center justify-center bg-gradient-to-br">
                <ListMusic className="text-muted-foreground/40 h-16 w-16" />
              </div>
            )}
          </div>

          {/* Playlist info */}
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Playlist
            </p>
            <h1 className="text-foreground mt-1 text-3xl font-black tracking-tight sm:text-4xl">
              {playlist.title}
            </h1>
            {playlist.description && (
              <p className="text-muted-foreground mt-2 text-sm">{playlist.description}</p>
            )}
            <div className="text-muted-foreground mt-3 flex items-center justify-center gap-2 text-sm sm:justify-start">
              {playlist.user.name && <span className="font-medium">{playlist.user.name}</span>}
              <span>&middot;</span>
              <span>
                {playlist.tracks.length} track{playlist.tracks.length !== 1 ? "s" : ""}
              </span>
              {totalDuration > 0 && (
                <>
                  <span>&middot;</span>
                  <span>{Math.floor(totalDuration / 60)} min</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-3 px-4 py-4 sm:px-6">
        <Button
          onClick={handlePlayAll}
          disabled={playlist.tracks.length === 0}
          className="bg-brand text-brand-foreground hover:bg-brand/90 gap-2 rounded-full px-6"
        >
          <Play className="h-5 w-5" fill="currentColor" strokeWidth={0} />
          Play
        </Button>
        <button
          type="button"
          onClick={handleShufflePlay}
          disabled={playlist.tracks.length === 0}
          className="text-muted-foreground hover:text-foreground flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:scale-105 disabled:opacity-40"
          aria-label="Shuffle play"
        >
          <Shuffle className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="text-muted-foreground hover:text-foreground flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:scale-105"
          aria-label="Share"
        >
          <Share2 className="h-5 w-5" />
        </button>
        {isOwner && playlist.isPublic && (
          <Link
            href={`/playlists/${playlist.id}`}
            className="text-muted-foreground hover:text-foreground flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:scale-105"
            aria-label="View public page"
            title="View public page"
          >
            <ExternalLink className="h-5 w-5" />
          </Link>
        )}
        {isOwner && (
          <>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => setShowDeleteDialog(true)}
              className="text-muted-foreground flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:text-red-500"
              aria-label="Delete playlist"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Track list */}
      <div className="px-4 pb-24 sm:px-6">
        {playlist.tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Music className="text-muted-foreground/40 mb-4 h-12 w-12" />
            <h3 className="text-foreground font-semibold">No tracks yet</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Add tracks from the{" "}
              <Link href="/music" className="text-brand hover:underline">
                music page
              </Link>{" "}
              to get started.
            </p>
          </div>
        ) : (
          <div className="divide-border/30 divide-y">
            {playlist.tracks.map((item, i) => {
              const isCurrentTrack = currentTrack?.id === item.music.id;
              const isActivelyPlaying = isCurrentTrack && isPlaying;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "group/row hover:bg-muted/50 flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors",
                    isCurrentTrack && "bg-muted/30"
                  )}
                >
                  {/* Rank / play */}
                  <button
                    type="button"
                    onClick={() => handlePlayTrack(item)}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center"
                    aria-label={isActivelyPlaying ? "Pause" : "Play"}
                  >
                    {isActivelyPlaying ? (
                      <div className="flex h-3.5 items-end gap-[2px]">
                        <span className="bg-brand w-[2.5px] animate-[soundloaded-equalizer_0.4s_ease_infinite] rounded-full" />
                        <span className="bg-brand w-[2.5px] animate-[soundloaded-equalizer_0.6s_ease_infinite_0.1s] rounded-full" />
                        <span className="bg-brand w-[2.5px] animate-[soundloaded-equalizer_0.5s_ease_infinite_0.2s] rounded-full" />
                      </div>
                    ) : (
                      <>
                        <span className="text-muted-foreground block text-sm tabular-nums group-hover/row:hidden">
                          {i + 1}
                        </span>
                        <Play
                          className="text-foreground hidden h-4 w-4 group-hover/row:block"
                          fill="currentColor"
                          strokeWidth={0}
                        />
                      </>
                    )}
                  </button>

                  {/* Cover */}
                  <Link
                    href={`/music/${item.music.slug}`}
                    className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded"
                  >
                    {item.music.coverArt ? (
                      <Image
                        src={item.music.coverArt}
                        alt={item.music.title}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <div className="from-brand/10 to-muted flex h-full w-full items-center justify-center bg-gradient-to-br">
                        <Music className="text-muted-foreground/40 h-4 w-4" />
                      </div>
                    )}
                  </Link>

                  {/* Title + artist */}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/music/${item.music.slug}`}
                      className={cn(
                        "block truncate text-sm font-semibold transition-colors hover:underline",
                        isCurrentTrack ? "text-brand" : "text-foreground"
                      )}
                    >
                      {item.music.title}
                    </Link>
                    <Link
                      href={`/artists/${item.music.artist.slug}`}
                      className="text-muted-foreground hover:text-foreground block truncate text-xs transition-colors"
                    >
                      {item.music.artist.name}
                    </Link>
                  </div>

                  {/* Duration */}
                  <span className="text-muted-foreground hidden text-xs tabular-nums sm:block">
                    {item.music.duration ? formatDuration(item.music.duration) : "--:--"}
                  </span>

                  {/* Heart */}
                  <HeartButton
                    musicId={item.music.id}
                    size={16}
                    className="flex-shrink-0 opacity-0 transition-opacity group-hover/row:opacity-100"
                  />

                  {/* More menu */}
                  {isOwner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground flex h-8 w-8 flex-shrink-0 items-center justify-center opacity-0 transition-opacity group-hover/row:opacity-100"
                          aria-label="Track options"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-red-500 focus:text-red-500"
                          onClick={() => handleRemoveTrack(item.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove from playlist
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Playlist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{playlist.title}&quot;? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {deletePlaylist.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
