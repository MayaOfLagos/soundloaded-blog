import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// ── Profile ────────────────────────────────────────────────────────────
export function useUserProfile() {
  return useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const { data } = await axios.get("/api/user/profile");
      return data.user ?? data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

// ── Dashboard Stats ────────────────────────────────────────────────────
export function useUserStats() {
  return useQuery({
    queryKey: ["user-stats"],
    queryFn: async () => {
      const { data } = await axios.get("/api/user/stats");
      return data as {
        totalDownloads: number;
        monthDownloads: number;
        totalComments: number;
        totalBookmarks: number;
        totalFavorites: number;
      };
    },
    staleTime: 60 * 1000,
  });
}

// ── Downloads ──────────────────────────────────────────────────────────
export function useUserDownloads(page = 1, from?: string, to?: string) {
  return useQuery({
    queryKey: ["user-downloads", page, from, to],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page) });
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const { data } = await axios.get(`/api/user/downloads?${params}`);
      return data as {
        downloads: Record<string, unknown>[];
        total: number;
        page: number;
        totalPages: number;
      };
    },
    staleTime: 60 * 1000,
  });
}

// ── Bookmarks ──────────────────────────────────────────────────────────
export function useUserBookmarks(page = 1, type?: string, sort = "newest") {
  return useQuery({
    queryKey: ["user-bookmarks", page, type, sort],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), sort });
      if (type) params.set("type", type);
      const { data } = await axios.get(`/api/user/bookmarks?${params}`);
      return data as {
        bookmarks: Record<string, unknown>[];
        total: number;
        page: number;
        totalPages: number;
      };
    },
    staleTime: 60 * 1000,
  });
}

export function useBookmarkCheck(postId?: string, musicId?: string) {
  return useQuery({
    queryKey: ["bookmark-check", postId, musicId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (postId) params.set("postId", postId);
      if (musicId) params.set("musicId", musicId);
      const { data } = await axios.get(`/api/user/bookmarks/check?${params}`);
      return data as { bookmarked: boolean; bookmarkId?: string };
    },
    enabled: !!(postId || musicId),
    staleTime: 2 * 60 * 1000,
  });
}

// ── Favorites ──────────────────────────────────────────────────────────
export function useUserFavorites(page = 1, type?: string, sort = "newest") {
  return useQuery({
    queryKey: ["user-favorites", page, type, sort],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), sort });
      if (type) params.set("type", type);
      const { data } = await axios.get(`/api/user/favorites?${params}`);
      return data as {
        favorites: Record<string, unknown>[];
        total: number;
        page: number;
        totalPages: number;
      };
    },
    staleTime: 60 * 1000,
  });
}

export function useFavoriteCheck(postId?: string, musicId?: string) {
  return useQuery({
    queryKey: ["favorite-check", postId, musicId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (postId) params.set("postId", postId);
      if (musicId) params.set("musicId", musicId);
      const { data } = await axios.get(`/api/user/favorites/check?${params}`);
      return data as { favorited: boolean; favoriteId?: string };
    },
    enabled: !!(postId || musicId),
    staleTime: 2 * 60 * 1000,
  });
}

// ── Library ────────────────────────────────────────────────────────────
export function useUserLibrary(page = 1, tab = "all", sort = "newest") {
  return useQuery({
    queryKey: ["user-library", page, tab, sort],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), tab, sort });
      const { data } = await axios.get(`/api/user/library?${params}`);
      return data as {
        items: Record<string, unknown>[];
        total: number;
        page: number;
        totalPages: number;
      };
    },
    staleTime: 60 * 1000,
  });
}

// ── Comments ───────────────────────────────────────────────────────────
export function useUserComments(page = 1, status?: string) {
  return useQuery({
    queryKey: ["user-comments", page, status],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page) });
      if (status && status !== "all") params.set("status", status);
      const { data } = await axios.get(`/api/user/comments?${params}`);
      return data as {
        comments: Record<string, unknown>[];
        total: number;
        page: number;
        totalPages: number;
      };
    },
    staleTime: 60 * 1000,
  });
}

// ── Transactions ───────────────────────────────────────────────────────
export function useUserTransactions(page = 1) {
  return useQuery({
    queryKey: ["user-transactions", page],
    queryFn: async () => {
      const { data } = await axios.get(`/api/user/transactions?page=${page}`);
      return data as {
        transactions: Record<string, unknown>[];
        total: number;
        page: number;
        totalPages: number;
      };
    },
    staleTime: 2 * 60 * 1000,
  });
}

// ── Notifications ──────────────────────────────────────────────────────
export function useUserNotifications(page = 1) {
  return useQuery({
    queryKey: ["user-notifications", page],
    queryFn: async () => {
      const { data } = await axios.get(`/api/user/notifications?page=${page}`);
      return data as {
        notifications: Record<string, unknown>[];
        total: number;
        page: number;
        totalPages: number;
      };
    },
    staleTime: 30 * 1000,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ["unread-notifications"],
    queryFn: async () => {
      const { data } = await axios.get("/api/user/notifications/unread-count");
      return data.count as number;
    },
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
}

// ── Preferences ────────────────────────────────────────────────────────
export function useUserPreferences() {
  return useQuery({
    queryKey: ["user-preferences"],
    queryFn: async () => {
      const { data } = await axios.get("/api/user/preferences");
      return data.preferences;
    },
    staleTime: 5 * 60 * 1000,
  });
}
