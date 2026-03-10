import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { notify } from "@/hooks/useToast";
import type { ReactionState } from "@/lib/api/reactions";

/** Check the current user's reaction on a single post */
export function useReactionCheck(postId: string) {
  return useQuery({
    queryKey: ["reaction-check", postId],
    queryFn: async () => {
      const { data } = await axios.get<ReactionState>(`/api/reactions?postId=${postId}`);
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

/** Batch check reactions for multiple posts (used in feed) */
export function useReactionBatchCheck(postIds: string[]) {
  return useQuery({
    queryKey: ["reaction-batch-check", postIds.join(",")],
    queryFn: async () => {
      const { data } = await axios.get<{
        reactions: Record<string, { id: string; emoji: string }>;
      }>(`/api/reactions/check?postIds=${postIds.join(",")}`);
      return data.reactions;
    },
    enabled: postIds.length > 0,
    staleTime: 2 * 60 * 1000,
  });
}

/** Set or change a reaction (upsert) */
export function useSetReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { postId: string; emoji: string }) => {
      const { data } = await axios.post<ReactionState>("/api/reactions", params);
      return data;
    },
    onMutate: async ({ postId, emoji }) => {
      await queryClient.cancelQueries({ queryKey: ["reaction-check", postId] });
      const prev = queryClient.getQueryData<ReactionState>(["reaction-check", postId]);

      queryClient.setQueryData<ReactionState>(["reaction-check", postId], (old) => {
        if (!old) return old;
        const newTotal = old.userReaction ? old.counts.total : old.counts.total + 1;
        return {
          userReaction: { id: old.userReaction?.id ?? "optimistic", emoji },
          counts: { ...old.counts, total: newTotal },
        };
      });

      return { prev, postId };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(["reaction-check", context.postId], context.prev);
      }
      notify.error("Failed to react");
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: ["reaction-check", vars.postId] });
      queryClient.invalidateQueries({ queryKey: ["reaction-batch-check"] });
      queryClient.invalidateQueries({ queryKey: ["explore"] });
    },
  });
}

/** Remove a reaction */
export function useRemoveReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { postId: string }) => {
      const { data } = await axios.delete<ReactionState>("/api/reactions", { data: params });
      return data;
    },
    onMutate: async ({ postId }) => {
      await queryClient.cancelQueries({ queryKey: ["reaction-check", postId] });
      const prev = queryClient.getQueryData<ReactionState>(["reaction-check", postId]);

      queryClient.setQueryData<ReactionState>(["reaction-check", postId], (old) => {
        if (!old) return old;
        return {
          userReaction: null,
          counts: { ...old.counts, total: Math.max(0, old.counts.total - 1) },
        };
      });

      return { prev, postId };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(["reaction-check", context.postId], context.prev);
      }
      notify.error("Failed to remove reaction");
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: ["reaction-check", vars.postId] });
      queryClient.invalidateQueries({ queryKey: ["reaction-batch-check"] });
      queryClient.invalidateQueries({ queryKey: ["explore"] });
    },
  });
}
