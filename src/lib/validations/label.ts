import { z } from "zod";

export const labelSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  bio: z.string().optional().nullable(),
  logo: z.string().url().optional().nullable().or(z.literal("")),
  coverImage: z.string().url().optional().nullable().or(z.literal("")),
  country: z.string().optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal("")),
  instagram: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  spotify: z.string().optional().nullable(),
  appleMusic: z.string().optional().nullable(),
  verified: z.boolean().optional(),
});

export type LabelFormValues = z.infer<typeof labelSchema>;
