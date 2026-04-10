import { z } from "zod";

// Only allow actual emoji characters (Unicode emoji ranges)
const emojiRegex = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\u{200D}\u{FE0F}]+$/u;

export const reactionSchema = z.object({
  postId: z.string().min(1),
  emoji: z.string().min(1).max(8).regex(emojiRegex, "Must be a valid emoji"),
});

export const reactionDeleteSchema = z.object({
  postId: z.string().min(1),
});
