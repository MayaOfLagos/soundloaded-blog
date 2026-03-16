import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { notify } from "@/hooks/useToast";

export function useFollowCheck(userId?: string) {
  return useQuery({
    queryKey: ["follow-check", userId],
    queryFn: async () => {
      const { data } = await axios.get<{ following: boolean }>(`/api/follow?checkUserId=${userId}`);
      return data;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useToggleFollow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, isFollowing }: { userId: string; isFollowing: boolean }) => {
      if (isFollowing) {
        await axios.delete("/api/follow", { data: { userId } });
        return { following: false };
      }
      const { data } = await axios.post<{ following: boolean }>("/api/follow", { userId });
      return data;
    },
    onSuccess: (result, vars) => {
      queryClient.invalidateQueries({ queryKey: ["follow-check", vars.userId] });
      queryClient.invalidateQueries({ queryKey: ["follow-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts", "foryou"] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts", "following"] });
      notify.success(result.following ? "Following" : "Unfollowed");
    },
    onError: () => {
      notify.error("Failed to update follow");
    },
  });
}

export function useFollowSuggestions() {
  return useQuery({
    queryKey: ["follow-suggestions"],
    queryFn: async () => {
      const { data } = await axios.get<{
        suggestions: {
          id: string;
          name: string | null;
          image: string | null;
          bio: string | null;
          followerCount: number;
          postCount: number;
        }[];
      }>("/api/follow/suggestions");
      return data.suggestions;
    },
    staleTime: 5 * 60 * 1000,
  });
}
