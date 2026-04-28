"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";
import {
  Play,
  Shuffle,
  Share2,
  Trash2,
  Globe,
  Lock,
  Music,
  ListMusic,
  Loader2,
  MoreHorizontal,
  Clock,
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
import { ScrollShelf, ShelfItem } from "@/components/music/ScrollShelf";
import { PlaylistCard } from "@/components/music/PlaylistCard";
import { useDeletePlaylist, useRemoveTrackFromPlaylist } from "@/hooks/usePlaylist";
import { usePlayerStore } from "@/store/player.store";
import { useDominantColor } from "@/hooks/useDominantColor";
import { HeartButton } from "@/components/music/HeartButton";
import { formatDuration } from "@/lib/utils";
import { notify } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import type { Track } from "@/store/player.store";
import type { PlaylistDetail, PlaylistTrackItem, PlaylistSummary } from "@/hooks/usePlaylist";

interface PlaylistPageClientProps {
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

export function PlaylistPageClient({ playlistId }: PlaylistPageClientProps) {
  const router = useRouter();
  useSession(); // ensure session context is available for owner checks

  const { data, isLoading } = useQuery({
    queryKey: ["public-playlist", playlistId],
    queryFn: async () => {
      const { data } = await axios.get<{ playlist: PlaylistDetail; isOwner: boolean }>(
        `/api/playlists/${playlistId}`
      );
      return data;
    },
  });

  // Fetch more public playlists for "More Playlists" section
  const { data: morePlaylists } = useQuery({
    queryKey: ["public-playlists-related", playlistId],
    queryFn: async () => {
      const { data } = await axios.get<{
        playlists: (PlaylistSummary & {
          creator: { name: string | null; username: string | null; image: string | null };
        })[];
      }>(`/api/playlists?limit=10&relatedTo=${playlistId}`);
      return data.playlists.filter((p) => p.id !== playlistId);
    },
    enabled: !!data?.playlist,
  });

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
    const url = `${window.location.origin}/playlists/${playlistId}`;
    if (navigator.share) {
      navigator.share({ title: playlist?.title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => notify.success("Link copied!"));
    }
  };

  const handlePlayTrack = (item: PlaylistTrackItem) => {
    if (!playlist) return;
    if (currentTrack?.id === item.music.id) {
      togglePlay();
      return;
    }
    setContextQueue(playlist.tracks.map(toPlayerTrack), playlist.title);
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
        <p className="text-muted-foreground mt-1 text-sm">
          This playlist may be private or no longer exists.
        </p>
        <Link href="/playlists" className="text-brand mt-4 text-sm hover:underline">
          Browse playlists
        </Link>
      </div>
    );
  }

  const covers = playlist.tracks
    .map((t) => t.music.coverArt)
    .filter(Boolean)
    .slice(0, 4);
  const gradientBg = dominantColor
    ? `linear-gradient(180deg, rgb(${dominantColor}) 0%, transparent 100%)`
    : undefined;
  const trackListBg = dominantColor
    ? `linear-gradient(180deg, rgba(${dominantColor}, 0.15) 0%, transparent 40%)`
    : undefined;

  return (
    <div>
      {/* Two-panel layout: info panel + track list */}
      <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-0 xl:grid-cols-[320px_1fr]">
        {/* ── Info Panel (sticky beside track list) ── */}
        <div
          className="relative rounded-xl px-4 pt-6 pb-6 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto"
          style={gradientBg ? { background: gradientBg } : undefined}
        >
          <div className="flex flex-col items-center text-center">
            {/* Cover art */}
            <div className="bg-muted relative h-48 w-48 flex-shrink-0 overflow-hidden rounded-xl shadow-2xl xl:h-56 xl:w-56">
              {playlist.coverImage ? (
                <Image
                  src={playlist.coverImage}
                  alt={playlist.title}
                  fill
                  className="object-cover"
                />
              ) : covers.length >= 4 ? (
                <div className="grid h-full w-full grid-cols-2 grid-rows-2">
                  {covers.map((src, i) => (
                    <div key={i} className="relative overflow-hidden">
                      <Image src={src!} alt="" fill className="object-cover" sizes="140px" />
                    </div>
                  ))}
                </div>
              ) : covers.length > 0 ? (
                <Image src={covers[0]!} alt={playlist.title} fill className="object-cover" />
              ) : (
                <div className="from-brand/20 to-muted flex h-full w-full items-center justify-center bg-gradient-to-br">
                  <ListMusic className="text-muted-foreground/30 h-20 w-20" />
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="text-foreground mt-5 text-2xl font-black tracking-tight sm:text-3xl">
              {playlist.title}
            </h1>

            {/* Creator */}
            <div className="mt-2 flex items-center gap-2">
              {playlist.user.image && (
                <Image
                  src={playlist.user.image}
                  alt=""
                  width={24}
                  height={24}
                  className="rounded-full object-cover"
                />
              )}
              <span className="text-muted-foreground text-sm font-medium">
                {playlist.user.name || playlist.user.username || "Anonymous"}
              </span>
            </div>

            {/* Description */}
            {playlist.description && (
              <p className="text-muted-foreground mt-3 max-w-xs text-sm leading-relaxed">
                {playlist.description}
              </p>
            )}

            {/* Metadata */}
            <div className="text-muted-foreground mt-3 flex items-center gap-2 text-xs">
              {playlist.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              <span>{playlist.isPublic ? "Public" : "Private"}</span>
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

            {/* Action buttons */}
            <div className="mt-5 flex items-center gap-3">
              <Button
                onClick={handlePlayAll}
                disabled={playlist.tracks.length === 0}
                className="bg-brand text-brand-foreground hover:bg-brand/90 gap-2 rounded-full px-8"
                size="lg"
              >
                <Play className="h-5 w-5" fill="currentColor" strokeWidth={0} />
                Play
              </Button>
              <button
                type="button"
                onClick={handleShufflePlay}
                disabled={playlist.tracks.length === 0}
                className="text-muted-foreground hover:text-foreground border-border flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:scale-105 disabled:opacity-40"
                aria-label="Shuffle play"
              >
                <Shuffle className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="text-muted-foreground hover:text-foreground border-border flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:scale-105"
                aria-label="Share"
              >
                <Share2 className="h-4 w-4" />
              </button>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-muted-foreground border-border flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:border-red-500/30 hover:text-red-500"
                  aria-label="Delete playlist"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Track List ── */}
        <div
          className="min-w-0 rounded-xl py-6 lg:pl-6"
          style={trackListBg ? { background: trackListBg } : undefined}
        >
          {/* Column headers (desktop) */}
          {playlist.tracks.length > 0 && (
            <div className="text-muted-foreground border-border/30 mb-2 hidden items-center gap-3 border-b px-2 pb-2 text-xs font-medium tracking-wider uppercase sm:flex">
              <span className="w-8 text-center">#</span>
              <span className="w-10" />
              <span className="flex-1">Title</span>
              <span className="hidden w-32 truncate lg:block">Album</span>
              <span className="w-12 text-right">
                <Clock className="ml-auto h-3.5 w-3.5" />
              </span>
              <span className="w-16" />
            </div>
          )}

          {/* Track rows */}
          {playlist.tracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Music className="text-muted-foreground/40 mb-4 h-12 w-12" />
              <h3 className="text-foreground font-semibold">This playlist is empty</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                No tracks have been added to this playlist yet.
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {playlist.tracks.map((item, i) => {
                const isCurrentTrack = currentTrack?.id === item.music.id;
                const isActivelyPlaying = isCurrentTrack && isPlaying;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "group/row hover:bg-muted/50 flex items-center gap-3 rounded-md px-2 py-2 transition-colors",
                      isCurrentTrack && "bg-muted/30"
                    )}
                  >
                    {/* # / play */}
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

                    {/* Album */}
                    {item.music.album && (
                      <Link
                        href={`/albums/${item.music.album.slug}`}
                        className="text-muted-foreground hover:text-foreground hidden w-32 truncate text-xs transition-colors lg:block"
                      >
                        {item.music.album.title}
                      </Link>
                    )}
                    {!item.music.album && <span className="hidden w-32 lg:block" />}

                    {/* Duration */}
                    <span className="text-muted-foreground hidden w-12 text-right text-xs tabular-nums sm:block">
                      {item.music.duration ? formatDuration(item.music.duration) : "--:--"}
                    </span>

                    {/* Heart + more */}
                    <div className="flex w-16 flex-shrink-0 items-center justify-end gap-1">
                      <HeartButton
                        musicId={item.music.id}
                        size={14}
                        className="opacity-0 transition-opacity group-hover/row:opacity-100"
                      />
                      {isOwner && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground flex h-7 w-7 items-center justify-center opacity-0 transition-opacity group-hover/row:opacity-100"
                              aria-label="Track options"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-red-500 focus:text-red-500"
                              onClick={() => removeTrack.mutate({ playlistId, trackId: item.id })}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove from playlist
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── More Playlists ── */}
          {morePlaylists && morePlaylists.length > 0 && (
            <div className="border-border/30 mt-8 border-t pt-8 pb-4">
              <ScrollShelf title="More Playlists" href="/playlists">
                {morePlaylists.map((p) => (
                  <ShelfItem
                    key={p.id}
                    className="w-[120px] min-w-[120px] sm:w-[140px] sm:min-w-[140px] lg:w-[150px] lg:min-w-[150px]"
                  >
                    <PlaylistCard playlist={p} showCreator publicLink />
                  </ShelfItem>
                ))}
              </ScrollShelf>
            </div>
          )}
        </div>
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
              {deletePlaylist.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
