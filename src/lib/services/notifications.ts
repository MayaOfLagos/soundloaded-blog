import { db } from "@/lib/db";

/**
 * Create a notification. Silently skips if recipient === actor or if recipient blocked the actor.
 */
async function createNotification({
  recipientId,
  actorId,
  type,
  title,
  body,
  link,
  metadata,
}: {
  recipientId: string;
  actorId: string;
  type:
    | "NEW_FOLLOWER"
    | "REACTION"
    | "NEW_COMMENT"
    | "COMMENT_REPLY"
    | "APPLICATION_SUBMITTED"
    | "APPLICATION_APPROVED"
    | "APPLICATION_REJECTED";
  title: string;
  body: string;
  link?: string;
  metadata?: Record<string, string>;
}) {
  if (recipientId === actorId) return null;

  // Skip notification if recipient has blocked the actor
  const block = await db.userBlock.findUnique({
    where: { blockerId_blockedId: { blockerId: recipientId, blockedId: actorId } },
  });
  if (block) return null;

  return db.notification.create({
    data: {
      userId: recipientId,
      actorId,
      type,
      title,
      body,
      link,
      metadata: metadata ?? undefined,
    },
  });
}

/** "X started following you" */
export async function notifyNewFollower(
  actorId: string,
  actorName: string,
  recipientId: string,
  actorUsername?: string | null
) {
  return createNotification({
    recipientId,
    actorId,
    type: "NEW_FOLLOWER",
    title: "New follower",
    body: `${actorName} started following you`,
    link: actorUsername ? `/author/${actorUsername}` : undefined,
  });
}

/** "X reacted to your post" */
export async function notifyReaction(
  actorId: string,
  actorName: string,
  postOwnerId: string,
  postId: string,
  emoji: string
) {
  return createNotification({
    recipientId: postOwnerId,
    actorId,
    type: "REACTION",
    title: "New reaction",
    body: `${actorName} reacted ${emoji} to your post`,
    metadata: { postId, emoji },
  });
}

/** "X commented on your post" */
export async function notifyComment(
  actorId: string,
  actorName: string,
  postOwnerId: string,
  postId: string
) {
  return createNotification({
    recipientId: postOwnerId,
    actorId,
    type: "NEW_COMMENT",
    title: "New comment",
    body: `${actorName} commented on your post`,
    metadata: { postId },
  });
}

/** "X replied to your comment" */
export async function notifyCommentReply(
  actorId: string,
  actorName: string,
  parentAuthorId: string,
  postId: string
) {
  return createNotification({
    recipientId: parentAuthorId,
    actorId,
    type: "COMMENT_REPLY",
    title: "New reply",
    body: `${actorName} replied to your comment`,
    metadata: { postId },
  });
}
