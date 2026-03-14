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
    staleTime: 2 * 60 * 1000,
  });

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (data?.favorited && data.favoriteId) {
        await axios.delete(`/api/user/favorites/${data.favoriteId}`);
        return { favorited: false };
      }
      await axios.post("/api/user/favorites", { musicId });
      return { favorited: true };
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
    toggleMutation.mutate();
  };

  return {
    isFavorited: data?.favorited ?? false,
    isLoading,
    toggleFavorite,
  };
}
