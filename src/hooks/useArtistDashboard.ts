import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";

type Track = {
  id: string;
  title: string;
  slug: string;
  coverArt: string | null;
  downloadCount: number;
  streamCount: number;
  format: string;
  fileSize: string;
  createdAt: string;
  album: { id: string; title: string; slug: string } | null;
};

type Album = {
  id: string;
  title: string;
  slug: string;
  coverArt: string | null;
  type: string;
  genre: string | null;
  releaseDate: string | null;
  _count: { tracks: number };
};

type ArtistProfile = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  photo: string | null;
  coverImage: string | null;
  country: string | null;
  genre: string | null;
  instagram: string | null;
  twitter: string | null;
  facebook: string | null;
  spotify: string | null;
  appleMusic: string | null;
  verified: boolean;
};

export function useArtistMusic(page = 1) {
  return useQuery({
    queryKey: ["artist-music", page],
    queryFn: async () => {
      const { data } = await axios.get<{
        tracks: Track[];
        total: number;
        page: number;
        limit: number;
      }>(`/api/artist/music?page=${page}`);
      return data;
    },
  });
}

export function useArtistAlbums(page = 1) {
  return useQuery({
    queryKey: ["artist-albums", page],
    queryFn: async () => {
      const { data } = await axios.get<{
        albums: Album[];
        total: number;
        page: number;
        limit: number;
      }>(`/api/artist/albums?page=${page}`);
      return data;
    },
  });
}

export function useArtistProfile() {
  return useQuery({
    queryKey: ["artist-profile"],
    queryFn: async () => {
      const { data } = await axios.get<ArtistProfile>("/api/artist/profile");
      return data;
    },
  });
}

export function useUpdateArtistProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: Partial<ArtistProfile>) => {
      const { data } = await axios.put("/api/artist/profile", values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artist-profile"] });
      toast.success("Profile updated!");
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });
}

export function useDeleteArtistTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trackId: string) => {
      await axios.delete(`/api/artist/music/${trackId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artist-music"] });
      toast.success("Track deleted");
    },
    onError: () => {
      toast.error("Failed to delete track");
    },
  });
}

export function useDeleteArtistAlbum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (albumId: string) => {
      await axios.delete(`/api/artist/albums/${albumId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artist-albums"] });
      toast.success("Album deleted");
    },
    onError: (err) => {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.error ?? "Failed to delete album");
      } else {
        toast.error("Failed to delete album");
      }
    },
  });
}
