"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useCreatePlaylist } from "@/hooks/usePlaylist";
import { Loader2 } from "lucide-react";

interface CreatePlaylistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If provided, auto-add this track after creation */
  onCreated?: (playlistId: string) => void;
}

export function CreatePlaylistModal({ open, onOpenChange, onCreated }: CreatePlaylistModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const createPlaylist = useCreatePlaylist();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createPlaylist.mutate(
      { title: title.trim(), description: description.trim() || undefined, isPublic },
      {
        onSuccess: (playlist) => {
          setTitle("");
          setDescription("");
          setIsPublic(false);
          onOpenChange(false);
          onCreated?.(playlist.id);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Create Playlist</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="playlist-title">Name</Label>
            <Input
              id="playlist-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Playlist"
              maxLength={100}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="playlist-desc">Description (optional)</Label>
            <Textarea
              id="playlist-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              maxLength={500}
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="playlist-public" className="text-sm font-medium">
                Make Public
              </Label>
              <p className="text-muted-foreground text-xs">Others can see this playlist</p>
            </div>
            <Switch id="playlist-public" checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={!title.trim() || createPlaylist.isPending}
          >
            {createPlaylist.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
