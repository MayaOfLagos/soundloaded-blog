import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { CreateUserPostInput } from "@/lib/validations/post";
import { notify } from "@/hooks/useToast";

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateUserPostInput) => {
      const { data } = await axios.post("/api/posts", input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      notify.success("Post published! 🎉");
    },
    onError: (err: unknown) => {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to create post";
      notify.error(message);
    },
  });
}
