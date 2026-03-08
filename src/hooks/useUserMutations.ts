import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { notify } from "@/hooks/useToast";

export function useToggleBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { postId?: string; musicId?: string; bookmarkId?: string }) => {
      if (params.bookmarkId) {
        await axios.delete(`/api/user/bookmarks/${params.bookmarkId}`);
        return { action: "removed" as const };
      }
      const { data } = await axios.post("/api/user/bookmarks", {
        postId: params.postId,
        musicId: params.musicId,
      });
      return { action: "added" as const, bookmark: data.bookmark };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["user-bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["bookmark-check"] });
      queryClient.invalidateQueries({ queryKey: ["user-library"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
      notify.success(result.action === "added" ? "Bookmarked" : "Bookmark removed");
    },
    onError: () => {
      notify.error("Failed to update bookmark");
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { postId?: string; musicId?: string; favoriteId?: string }) => {
      if (params.favoriteId) {
        await axios.delete(`/api/user/favorites/${params.favoriteId}`);
        return { action: "removed" as const };
      }
      const { data } = await axios.post("/api/user/favorites", {
        postId: params.postId,
        musicId: params.musicId,
      });
      return { action: "added" as const, favorite: data.favorite };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["user-favorites"] });
      queryClient.invalidateQueries({ queryKey: ["favorite-check"] });
      queryClient.invalidateQueries({ queryKey: ["user-library"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
      notify.success(result.action === "added" ? "Added to favorites" : "Removed from favorites");
    },
    onError: () => {
      notify.error("Failed to update favorite");
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name?: string;
      bio?: string;
      location?: string;
      socialLinks?: { twitter?: string; instagram?: string };
      image?: string;
    }) => {
      const { data: result } = await axios.patch("/api/user/profile", data);
      return result.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      notify.success("Profile updated");
    },
    onError: () => {
      notify.error("Failed to update profile");
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }) => {
      await axios.patch("/api/user/password", data);
    },
    onSuccess: () => {
      notify.success("Password changed successfully");
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { error?: string } } };
      const message = axiosError?.response?.data?.error || "Failed to change password";
      notify.error(message);
    },
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, boolean | string>) => {
      const { data: result } = await axios.patch("/api/user/preferences", data);
      return result.preferences;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-preferences"] });
      notify.success("Preferences saved");
    },
    onError: () => {
      notify.error("Failed to save preferences");
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id?: string; markAllRead?: boolean }) => {
      await axios.patch("/api/user/notifications", params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications"] });
    },
  });
}

export function useExportData() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await axios.post("/api/user/export");
      return data;
    },
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "soundloaded-data-export.json";
      a.click();
      URL.revokeObjectURL(url);
      notify.success("Data exported successfully");
    },
    onError: () => {
      notify.error("Failed to export data");
    },
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async (password: string) => {
      await axios.post("/api/user/delete-account", { password });
    },
    onSuccess: () => {
      notify.success("Account deleted");
      window.location.href = "/";
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { error?: string } } };
      const message = axiosError?.response?.data?.error || "Failed to delete account";
      notify.error(message);
    },
  });
}
