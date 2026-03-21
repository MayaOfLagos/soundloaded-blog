import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface BlockStatus {
  blocked: boolean;
  muted: boolean;
  type: "BLOCK" | "MUTE" | null;
}

export function useBlockCheck(userId: string | undefined) {
  return useQuery({
    queryKey: ["block-check", userId],
    queryFn: async () => {
      const { data } = await axios.get<BlockStatus>(`/api/user/blocks?checkUserId=${userId}`);
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useToggleBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      isBlocked,
      type = "BLOCK",
    }: {
      userId: string;
      isBlocked: boolean;
      type?: "BLOCK" | "MUTE";
    }) => {
      if (isBlocked) {
        await axios.delete(`/api/user/blocks?blockedId=${userId}`);
      } else {
        await axios.post("/api/user/blocks", { blockedId: userId, type });
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["block-check", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["follow-check", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      queryClient.invalidateQueries({ queryKey: ["explore"] });
    },
  });
}
