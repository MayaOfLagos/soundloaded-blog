import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";
import { notify } from "@/hooks/useToast";
import type { ClientCreatorEventContext } from "@/lib/client/creator-events";

interface PlaylistSummary {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  isPublic: boolean;
  trackCount: number;
  coverArts: (string | null)[];
  createdAt: string;
  updatedAt: string;
}

interface PlaylistTrackMusic {
  id: string;
  title: string;
  slug: string;
  coverArt: string | null;
  duration: number | null;
  genre: string | null;
  r2Key: string;
  streamCount: number;
  downloadCount: number;
  enableDownload: boolean;
  isExclusive: boolean;
  price: number | null;
  accessModel: string;
  streamAccess: string;
  creatorPrice: number | null;
  artist: { name: string; slug: string };
  album: { title: string; slug: string } | null;
}

interface PlaylistTrackItem {
  id: string;
  playlistId: string;
  musicId: string;
  position: number;
  addedAt: string;
  music: PlaylistTrackMusic;
}

interface PlaylistDetail {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  isPublic: boolean;
  userId: string;
  user: { name: string | null; username: string | null; image: string | null };
  tracks: PlaylistTrackItem[];
  createdAt: string;
  updatedAt: string;
}

// ── List user's playlists ──
export function useUserPlaylists() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ["user-playlists"],
    queryFn: async () => {
      const { data } = await axios.get<{
        playlists: PlaylistSummary[];
        total: number;
      }>("/api/user/playlists?limit=50");
      return data;
    },
    enabled: !!session?.user,
    staleTime: 30_000,
  });
}

// ── Get single playlist with tracks ──
export function usePlaylist(id: string | null) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ["playlist", id],
    queryFn: async () => {
      const { data } = await axios.get<{
        playlist: PlaylistDetail;
        isOwner: boolean;
      }>(`/api/user/playlists/${id}`);
      return data;
    },
    enabled: !!session?.user && !!id,
    staleTime: 15_000,
  });
}

// ── Create playlist ──
export function useCreatePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { title: string; description?: string; isPublic?: boolean }) => {
      const { data: res } = await axios.post("/api/user/playlists", data);
      return res.playlist as PlaylistSummary;
    },
    onSuccess: (playlist) => {
      queryClient.invalidateQueries({ queryKey: ["user-playlists"] });
      notify.success(`Created "${playlist.title}"`);
    },
    onError: () => {
      notify.error("Failed to create playlist");
    },
  });
}

// ── Update playlist ──
export function useUpdatePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      title?: string;
      description?: string | null;
      isPublic?: boolean;
      coverImage?: string | null;
    }) => {
      const { data: res } = await axios.patch(`/api/user/playlists/${id}`, data);
      return res.playlist;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["playlist", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["user-playlists"] });
      notify.success("Playlist updated");
    },
    onError: () => {
      notify.error("Failed to update playlist");
    },
  });
}

// ── Delete playlist ──
export function useDeletePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/user/playlists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-playlists"] });
      notify.success("Playlist deleted");
    },
    onError: () => {
      notify.error("Failed to delete playlist");
    },
  });
}

// ── Add track to playlist ──
export function useAddTrackToPlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      playlistId,
      musicId,
      source,
    }: {
      playlistId: string;
      musicId: string;
      source?: ClientCreatorEventContext;
    }) => {
      const { data } = await axios.post(`/api/user/playlists/${playlistId}/tracks`, {
        musicId,
        ...source,
      });
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["playlist", variables.playlistId] });
      queryClient.invalidateQueries({ queryKey: ["user-playlists"] });
      notify.success("Added to playlist");
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        notify.error("Track already in playlist");
      } else {
        notify.error("Failed to add track");
      }
    },
  });
}

// ── Remove track from playlist ──
export function useRemoveTrackFromPlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playlistId, trackId }: { playlistId: string; trackId: string }) => {
      await axios.delete(`/api/user/playlists/${playlistId}/tracks/${trackId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["playlist", variables.playlistId] });
      queryClient.invalidateQueries({ queryKey: ["user-playlists"] });
      notify.success("Removed from playlist");
    },
    onError: () => {
      notify.error("Failed to remove track");
    },
  });
}

// ── Reorder tracks ──
export function useReorderPlaylistTracks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      playlistId,
      tracks,
    }: {
      playlistId: string;
      tracks: { id: string; position: number }[];
    }) => {
      await axios.patch(`/api/user/playlists/${playlistId}/tracks`, { tracks });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["playlist", variables.playlistId] });
    },
    onError: () => {
      notify.error("Failed to reorder tracks");
    },
  });
}

export type { PlaylistSummary, PlaylistDetail, PlaylistTrackItem, PlaylistTrackMusic };
