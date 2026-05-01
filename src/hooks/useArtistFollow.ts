import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { notify } from "@/hooks/useToast";
import type { ClientCreatorEventContext } from "@/lib/client/creator-events";

interface ArtistFollowData {
  following: boolean;
  followerCount: number;
}

export function useArtistFollow(artistId: string, source?: ClientCreatorEventContext) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["artist-follow", artistId],
    queryFn: async () => {
      const { data } = await axios.get<ArtistFollowData>(
        `/api/artists/follow?artistId=${artistId}`
      );
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });

  const { mutate: toggle, isPending } = useMutation({
    mutationFn: async (isFollowing: boolean) => {
      if (isFollowing) {
        const { data } = await axios.delete<ArtistFollowData>("/api/artists/follow", {
          data: { artistId, ...source },
        });
        return data;
      }
      const { data } = await axios.post<ArtistFollowData>("/api/artists/follow", {
        artistId,
        ...source,
      });
      return data;
    },
    onMutate: async (isFollowing) => {
      await queryClient.cancelQueries({ queryKey: ["artist-follow", artistId] });
      const prev = queryClient.getQueryData<ArtistFollowData>(["artist-follow", artistId]);
      queryClient.setQueryData<ArtistFollowData>(["artist-follow", artistId], (old) => ({
        following: !isFollowing,
        followerCount: (old?.followerCount ?? 0) + (isFollowing ? -1 : 1),
      }));
      return { prev };
    },
    onSuccess: (result) => {
      notify.success(result.following ? "Following artist" : "Unfollowed artist");
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(["artist-follow", artistId], ctx.prev);
      }
      notify.error("Failed to update follow");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["artist-follow", artistId] });
    },
  });

  return {
    isFollowing: data?.following ?? false,
    followerCount: data?.followerCount ?? 0,
    isLoading,
    isPending,
    toggle: () => toggle(data?.following ?? false),
  };
}
