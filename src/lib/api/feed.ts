import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";

export interface FeedPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: unknown;
  coverImage: string | null;
  type: string;
  isUserGenerated: boolean;
  mediaAttachments: Array<{
    url: string;
    key: string;
    type: "IMAGE" | "VIDEO" | "AUDIO";
    mimeType: string;
    width?: number;
    height?: number;
  }>;
  publishedAt: string | null;
  createdAt: string;
  views: number;
  author: {
    id: string;
    name: string | null;
    image: string | null;
    username: string | null;
  };
  category: {
    name: string;
    slug: string;
  } | null;
  commentCount: number;
  reactionCount: number;
}

interface FeedResponse {
  posts: FeedPost[];
  nextCursor: string | null;
}

export function useFeedPosts(type: "foryou" | "following" | "discover" = "foryou") {
  return useInfiniteQuery({
    queryKey: ["feed-posts", type],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      params.set("limit", "20");
      params.set("feed", type);
      if (pageParam) params.set("cursor", pageParam);

      const { data } = await axios.get<FeedResponse>(`/api/posts?${params.toString()}`);
      return data;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });
}
