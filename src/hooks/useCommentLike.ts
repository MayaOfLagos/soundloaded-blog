import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface ToggleLikeResult {
  userLike: "LIKE" | "DISLIKE" | null;
  likeCount: number;
  dislikeCount: number;
}

export function useCommentLike(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, type }: { commentId: string; type: "LIKE" | "DISLIKE" }) => {
      const { data } = await axios.post<ToggleLikeResult>(`/api/comments/${commentId}/like`, {
        type,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-comments", postId] });
    },
  });
}
