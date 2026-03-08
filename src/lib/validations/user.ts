import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(80).optional(),
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
