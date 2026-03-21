import { db } from "@/lib/db";

/**
 * Get IDs of users blocked by this user (excludes their content from feeds).
 */
export async function getBlockedUserIds(userId: string): Promise<string[]> {
  const blocks = await db.userBlock.findMany({
    where: { blockerId: userId, type: "BLOCK" },
    select: { blockedId: true },
  });
  return blocks.map((b) => b.blockedId);
}

/**
 * Get IDs of users who have blocked this user (hides this user from their content).
 */
export async function getBlockedByUserIds(userId: string): Promise<string[]> {
  const blocks = await db.userBlock.findMany({
    where: { blockedId: userId, type: "BLOCK" },
    select: { blockerId: true },
  });
  return blocks.map((b) => b.blockerId);
}

/**
 * Get all users that should be excluded from this user's feeds
 * (both users they blocked AND users who blocked them).
 */
export async function getExcludedUserIds(userId: string): Promise<string[]> {
  const [blocked, blockedBy] = await Promise.all([
    getBlockedUserIds(userId),
    getBlockedByUserIds(userId),
  ]);
  return [...new Set([...blocked, ...blockedBy])];
}

/**
 * Check if userA has blocked userB.
 */
export async function isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const block = await db.userBlock.findUnique({
    where: { blockerId_blockedId: { blockerId, blockedId } },
  });
  return block?.type === "BLOCK";
}
