import { z } from "zod";

export const artistSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  bio: z.string().optional().nullable(),
  photo: z.string().url().optional().nullable().or(z.literal("")),
  coverImage: z.string().url().optional().nullable().or(z.literal("")),
  country: z.string().optional().nullable(),
  genre: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  spotify: z.string().optional().nullable(),
  appleMusic: z.string().optional().nullable(),
  youtube: z.string().optional().nullable(),
  tiktok: z.string().optional().nullable(),
  soundcloud: z.string().optional().nullable(),
  boomplay: z.string().optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal("")),
  verified: z.boolean().optional(),
});

export type ArtistFormValues = z.infer<typeof artistSchema>;
