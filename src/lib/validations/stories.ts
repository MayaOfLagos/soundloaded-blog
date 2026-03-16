import { z } from "zod";

export const GRADIENT_PRESETS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
  "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
] as const;

export const storyItemSchema = z.object({
  mediaUrl: z.string(),
  type: z.enum(["IMAGE", "VIDEO", "GIF", "TEXT"]).default("IMAGE"),
  caption: z.string().max(280).optional(),
  duration: z.number().int().min(3).max(30).default(5),
  audioUrl: z.string().optional(),
  audioStartTime: z.number().min(0).default(0),
  audioEndTime: z.number().min(0).max(300).default(30),
  backgroundColor: z.string().optional(),
  textContent: z.string().max(500).optional(),
});

export const createStorySchema = z
  .object({
    items: z.array(storyItemSchema).min(1).max(10),
  })
  .superRefine((data, ctx) => {
    data.items.forEach((item, i) => {
      if (item.type === "TEXT" && !item.textContent) {
        ctx.addIssue({
          code: "custom",
          message: "Text stories require textContent",
          path: ["items", i, "textContent"],
        });
      }
      if (item.type === "TEXT" && !item.backgroundColor) {
        ctx.addIssue({
          code: "custom",
          message: "Text stories require a background color",
          path: ["items", i, "backgroundColor"],
        });
      }
      if (item.type === "VIDEO" && item.audioUrl) {
        ctx.addIssue({
          code: "custom",
          message: "Video stories cannot have audio overlay",
          path: ["items", i, "audioUrl"],
        });
      }
      if (item.audioUrl && item.audioEndTime - item.audioStartTime > 30) {
        ctx.addIssue({
          code: "custom",
          message: "Audio segment cannot exceed 30 seconds",
          path: ["items", i, "audioEndTime"],
        });
      }
    });
  });
