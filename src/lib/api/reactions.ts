export const REACTION_EMOJIS = [
  { emoji: "❤️", label: "Love" },
  { emoji: "😂", label: "Haha" },
  { emoji: "😮", label: "Wow" },
  { emoji: "😢", label: "Sad" },
  { emoji: "🔥", label: "Fire" },
  { emoji: "👏", label: "Clap" },
  { emoji: "🙏", label: "Grateful" },
] as const;

export interface ReactionState {
  userReaction: { id: string; emoji: string } | null;
  counts: {
    total: number;
    byEmoji: Record<string, number>;
  };
}
