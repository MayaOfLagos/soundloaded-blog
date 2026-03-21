import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface AdminStoriesStats {
  totalStories24h: number;
  activeStories: number;
  totalViews: number;
  avgViewsPerStory: number;
}

interface AdminStory {
  id: string;
  author: { id: string; name: string | null; image: string | null };
  type: string;
  itemCount: number;
  viewCount: number;
  createdAt: string;
  expiresAt: string;
  status: "active" | "expired";
}

interface AdminStoriesResponse {
  stats: AdminStoriesStats;
  chartData: { date: string; count: number }[];
  stories: AdminStory[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export function useAdminStories(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["admin-stories", page, limit],
    queryFn: async () => {
      const { data } = await axios.get<AdminStoriesResponse>(
        `/api/admin/stories?page=${page}&limit=${limit}`
      );
      return data;
    },
    staleTime: 30 * 1000,
  });
}
