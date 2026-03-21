import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";
import { notify } from "@/hooks/useToast";

interface FavoriteCheckResponse {
  favorited: boolean;
  favoriteId?: string;
}

export function useMusicFavorite(musicId: string) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  const queryKey = ["favorite-check", "music", musicId];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data } = await axios.get<FavoriteCheckResponse>(
        `/api/user/favorites/check?musicId=${musicId}`
      );
      return data;
    },
    enabled: isAuthenticated && !!musicId,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const toggleMutation = useMutation({
    // Pass the pre-optimistic snapshot as a variable so mutationFn
    // always knows the true state before onMutate flips the cache
    mutationFn: async (snapshot: FavoriteCheckResponse) => {
      if (snapshot.favorited && snapshot.favoriteId) {
        await axios.delete(`/api/user/favorites/${snapshot.favoriteId}`);
        return { favorited: false } as FavoriteCheckResponse;
      }
      const { data: res } = await axios.post("/api/user/favorites", { musicId });
      return {
        favorited: true,
        favoriteId: res.favorite.id as string,
      } as FavoriteCheckResponse;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<FavoriteCheckResponse>(queryKey);

      queryClient.setQueryData<FavoriteCheckResponse>(queryKey, (old) => ({
        favorited: !old?.favorited,
        favoriteId: old?.favorited ? undefined : (old?.favoriteId ?? "optimistic"),
      }));

      return { prev };
    },
    onSuccess: (result) => {
      // Immediately set cache with real server data (real favoriteId)
      queryClient.setQueryData<FavoriteCheckResponse>(queryKey, result);
      notify.success(result.favorited ? "Added to favorites" : "Removed from favorites");
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(queryKey, context.prev);
      }
      notify.error("Failed to update favorite");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["user-favorites"] });
    },
  });

  const toggleFavorite = () => {
    if (!isAuthenticated) {
      notify.error("Sign in to save favorites");
      return;
    }
    // Capture state BEFORE optimistic update flips it
    const snapshot = queryClient.getQueryData<FavoriteCheckResponse>(queryKey) ?? {
      favorited: false,
    };
    toggleMutation.mutate(snapshot);
  };

  return {
    isFavorited: data?.favorited ?? false,
    isLoading,
    toggleFavorite,
  };
}
