import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { notify } from "@/hooks/useToast";

export function useFileReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { postId: string; reason: string; details?: string }) => {
      const { data } = await axios.post("/api/reports", params);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
      notify.success("Report submitted. Thanks for helping keep the community safe.");
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { error?: string } } };
      const message = axiosError?.response?.data?.error || "Failed to submit report";
      notify.error(message);
    },
  });
}
