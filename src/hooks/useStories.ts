import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { StoryGroupResponse } from "@/app/api/stories/route";

export interface CreateStoryItem {
  mediaUrl: string;
  type?: "IMAGE" | "VIDEO" | "GIF" | "TEXT";
  caption?: string;
  duration?: number;
  audioUrl?: string;
  audioStartTime?: number;
  audioEndTime?: number;
  backgroundColor?: string;
  textContent?: string;
}

export function useStories() {
  return useQuery({
    queryKey: ["stories"],
    queryFn: async () => {
      const { data } = await axios.get<{ storyGroups: StoryGroupResponse[] }>("/api/stories");
      return data.storyGroups;
    },
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });
}

export function useCreateStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: CreateStoryItem[]) => {
      const { data } = await axios.post("/api/stories", { items });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
}

export function useMarkStoryViewed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (storyItemId: string) => {
      await axios.post("/api/stories/view", { storyItemId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
}
