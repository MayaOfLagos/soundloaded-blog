import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { notify } from "@/hooks/useToast";

/** Check if the current user has hidden a specific post */
export function useHiddenPostCheck(postId?: string) {
  return useQuery({
    queryKey: ["hidden-post-check", postId],
    queryFn: async () => {
      const { data } = await axios.get<{
        hiddenPosts: { postId: string }[];
      }>(`/api/user/hidden-posts?limit=200`);
      const isHidden = data.hiddenPosts.some((hp) => hp.postId === postId);
      return { hidden: isHidden };
    },
    enabled: !!postId,
    staleTime: 2 * 60 * 1000,
  });
}

/** Hide or unhide a post */
export function useToggleHiddenPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, isHidden }: { postId: string; isHidden: boolean }) => {
      if (isHidden) {
        await axios.delete("/api/user/hidden-posts", { data: { postId } });
        return { hidden: false };
      }
      await axios.post("/api/user/hidden-posts", { postId });
      return { hidden: true };
    },
    onSuccess: (_result, vars) => {
      queryClient.invalidateQueries({ queryKey: ["hidden-post-check", vars.postId] });
      queryClient.invalidateQueries({ queryKey: ["user-hidden-posts"] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
    },
    onError: () => {
      notify.error("Failed to update hidden post");
    },
  });
}

/** Paginated list of hidden posts for user library */
export function useUserHiddenPosts(page = 1) {
  return useQuery({
    queryKey: ["user-hidden-posts", page],
    queryFn: async () => {
      const { data } = await axios.get(`/api/user/hidden-posts?page=${page}`);
      return data as {
        hiddenPosts: Array<{
          id: string;
          postId: string;
          createdAt: string;
          post: {
            id: string;
            title: string;
            slug: string;
            excerpt: string | null;
            coverImage: string | null;
            type: string;
            isUserGenerated: boolean;
            createdAt: string;
            author: { id: string; name: string | null; image: string | null };
          };
        }>;
        total: number;
        page: number;
        totalPages: number;
      };
    },
    staleTime: 60 * 1000,
  });
}
