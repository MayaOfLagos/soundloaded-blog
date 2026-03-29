"use client";

import { useState } from "react";
import { Plus, ListMusic, Loader2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserPlaylists } from "@/hooks/usePlaylist";
import { PlaylistCard } from "@/components/music/PlaylistCard";
import { CreatePlaylistModal } from "@/components/music/CreatePlaylistModal";
import Link from "next/link";

export default function PlaylistsPage() {
  const { data, isLoading } = useUserPlaylists();
  const [showCreate, setShowCreate] = useState(false);

  const playlists = data?.playlists ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">Your Playlists</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {playlists.length} playlist{playlists.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Create
        </Button>
      </div>

      {/* Virtual playlists */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Link
          href="/library?tab=favorites&type=music"
          className="group/card hover:bg-muted/50 rounded-lg p-3 transition-colors"
        >
          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-pink-500 to-rose-600">
            <Heart className="h-12 w-12 text-white" fill="white" />
          </div>
          <div className="mt-2">
            <p className="text-foreground group-hover/card:text-brand text-sm font-bold transition-colors">
              Liked Songs
            </p>
            <p className="text-muted-foreground text-xs">Your favorites</p>
          </div>
        </Link>
      </div>

      {/* User playlists */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      ) : playlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ListMusic className="text-muted-foreground/40 mb-4 h-16 w-16" />
          <h2 className="text-foreground text-lg font-semibold">No playlists yet</h2>
          <p className="text-muted-foreground mt-1 mb-4 max-w-sm text-sm">
            Create a playlist to organize your favorite tracks and listen your way.
          </p>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Your First Playlist
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {playlists.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} showPrivacy />
          ))}
        </div>
      )}

      <CreatePlaylistModal open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}
