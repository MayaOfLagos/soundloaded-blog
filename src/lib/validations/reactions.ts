import { z } from "zod";

export const reactionSchema = z.object({
  postId: z.string().min(1),
  emoji: z.string().min(1).max(32),
});

export const reactionDeleteSchema = z.object({
  postId: z.string().min(1),
});
