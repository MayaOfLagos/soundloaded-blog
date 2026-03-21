import { z } from "zod";

export const creatorApplicationSchema = z.object({
  type: z.enum(["ARTIST", "LABEL"]),
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
  bio: z.string().max(1000, "Bio must be under 1000 characters").optional().nullable(),
  genre: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  photo: z.string().url().optional().nullable().or(z.literal("")),
  socialLinks: z
    .object({
      instagram: z.string().optional().nullable(),
      twitter: z.string().optional().nullable(),
      facebook: z.string().optional().nullable(),
      spotify: z.string().optional().nullable(),
      appleMusic: z.string().optional().nullable(),
      website: z.string().url().optional().nullable().or(z.literal("")),
    })
    .optional()
    .nullable(),
  proofUrls: z
    .array(z.string().url("Each proof link must be a valid URL"))
    .max(5, "Maximum 5 proof links")
    .optional()
    .nullable(),
});

export type CreatorApplicationFormValues = z.infer<typeof creatorApplicationSchema>;

export const applicationReviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewNote: z.string().max(500).optional().nullable(),
});

export type ApplicationReviewValues = z.infer<typeof applicationReviewSchema>;
