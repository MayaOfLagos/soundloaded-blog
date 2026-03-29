import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/,
      "Username must start and end with a letter or number and can only contain lowercase letters, numbers, dots, hyphens, and underscores"
    )
    .optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  socialLinks: z
    .object({
      twitter: z.string().max(50).optional(),
      instagram: z.string().max(50).optional(),
    })
    .optional(),
  image: z.string().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const bookmarkSchema = z
  .object({
    postId: z.string().optional(),
    musicId: z.string().optional(),
  })
  .refine((d) => d.postId || d.musicId, {
    message: "postId or musicId is required",
  });

export const favoriteSchema = z
  .object({
    postId: z.string().optional(),
    musicId: z.string().optional(),
  })
  .refine((d) => d.postId || d.musicId, {
    message: "postId or musicId is required",
  });

export const preferencesSchema = z.object({
  pushEnabled: z.boolean().optional(),
  emailDigest: z.boolean().optional(),
  emailCommentReplies: z.boolean().optional(),
  emailNewMusic: z.boolean().optional(),
  emailNewsletter: z.boolean().optional(),
  emailMarketing: z.boolean().optional(),
  showProfile: z.boolean().optional(),
  showDownloadHistory: z.boolean().optional(),
  themePreference: z.enum(["light", "dark", "system"]).optional(),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required to delete account"),
});

// ── Playlists ──
export const createPlaylistSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
});

export const updatePlaylistSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  isPublic: z.boolean().optional(),
  coverImage: z.string().nullable().optional(),
});

export const addTrackToPlaylistSchema = z.object({
  musicId: z.string().min(1, "musicId is required"),
});

export const reorderPlaylistSchema = z.object({
  tracks: z.array(
    z.object({
      id: z.string(),
      position: z.number().int().min(0),
    })
  ),
});
