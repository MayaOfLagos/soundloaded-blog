"use client";

import { useState } from "react";
import Image from "next/image";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useUserPlaylists, useAddTrackToPlaylist } from "@/hooks/usePlaylist";
import { CreatePlaylistModal } from "./CreatePlaylistModal";
import { Plus, ListMusic, Loader2, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

interface PlaylistPickerProps {
  musicId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlaylistPicker({ musicId, open, onOpenChange }: PlaylistPickerProps) {
  const { data: session } = useSession();
  const { data, isLoading } = useUserPlaylists();
  const addTrack = useAddTrackToPlaylist();
  const [showCreate, setShowCreate] = useState(false);
  const [addingTo, setAddingTo] = useState<string | null>(null);

  if (!session?.user) {
    return null;
  }

  const playlists = data?.playlists ?? [];

  const handleAdd = (playlistId: string) => {
    setAddingTo(playlistId);
    addTrack.mutate(
      { playlistId, musicId },
      {
        onSettled: () => setAddingTo(null),
        onSuccess: () => onOpenChange(false),
      }
    );
  };

  const handleCreated = (playlistId: string) => {
    // Auto-add the track to the newly created playlist
    addTrack.mutate({ playlistId, musicId }, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <ListMusic className="h-5 w-5" />
              Add to Playlist
            </SheetTitle>
          </SheetHeader>

          <Button
            variant="outline"
            className="mb-4 w-full justify-start gap-2"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="h-4 w-4" />
            Create New Playlist
          </Button>

          <div className="max-h-[50vh] space-y-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
              </div>
            ) : playlists.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center text-sm">
                No playlists yet. Create one to get started!
              </div>
            ) : (
              playlists.map((playlist) => {
                const isAdding = addingTo === playlist.id;

                return (
                  <button
                    key={playlist.id}
                    type="button"
                    onClick={() => handleAdd(playlist.id)}
                    disabled={isAdding}
                    className={cn(
                      "hover:bg-muted/50 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                      isAdding && "opacity-50"
                    )}
                  >
                    {/* Cover preview */}
                    <div className="bg-muted flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded">
                      {playlist.coverArts.length > 0 && playlist.coverArts[0] ? (
                        <Image
                          src={playlist.coverArts[0]}
                          alt=""
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Music className="text-muted-foreground h-4 w-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-foreground truncate text-sm font-medium">
                        {playlist.title}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {playlist.trackCount} track{playlist.trackCount !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {isAdding && <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />}
                  </button>
                );
              })
            )}
          </div>
        </SheetContent>
      </Sheet>

      <CreatePlaylistModal
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={handleCreated}
      />
    </>
  );
}
