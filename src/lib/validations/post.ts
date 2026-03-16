import { z } from "zod";

/**
 * User-facing post creation schema (for /feed composer).
 * Intentionally simpler than the admin post schema.
 */
export const createUserPostSchema = z.object({
  /** TipTap JSONContent body — required, must have at least some content */
  body: z
    .any()
    .refine(
      (val) =>
        val &&
        typeof val === "object" &&
        val.type === "doc" &&
        Array.isArray(val.content) &&
        val.content.length > 0,
      { message: "Post body is required" }
    ),

  /** Optional plain-text excerpt (auto-generated on server if omitted) */
  excerpt: z.string().max(300).optional(),

  /**
   * Media attachments — array of uploaded media objects.
   * Each must have url, key, type, and mimeType from the upload step.
   */
  mediaAttachments: z
    .array(
      z.object({
        url: z.string().url(),
        key: z.string().min(1),
        type: z.enum(["IMAGE", "VIDEO", "AUDIO"]),
        mimeType: z.string().min(1),
        width: z.number().optional(),
        height: z.number().optional(),
      })
    )
    .max(10, "Maximum 10 attachments per post")
    .default([]),

  /** Optional cover image URL (first image attachment is used if omitted) */
  coverImage: z.string().url().optional().or(z.literal("")),
});

export type CreateUserPostInput = z.infer<typeof createUserPostSchema>;
