import { z } from "zod";

export const albumSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  artistId: z.string().min(1, "Artist is required"),
  coverArt: z.string().url().optional().nullable().or(z.literal("")),
  releaseDate: z.string().optional().nullable(),
  type: z.enum(["ALBUM", "EP", "MIXTAPE", "COMPILATION"]).default("ALBUM"),
  genre: z.string().optional().nullable(),
  label: z.string().optional().nullable(),
});

export type AlbumFormValues = z.infer<typeof albumSchema>;
