import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reactionSchema, reactionDeleteSchema } from "@/lib/validations/reactions";
import type { ReactionState } from "@/lib/api/reactions";
import { notifyReaction } from "@/lib/services/notifications";

async function getReactionState(postId: string, userId: string): Promise<ReactionState> {
  const [userReaction, counts] = await Promise.all([
    db.reaction.findUnique({
      where: { userId_postId: { userId, postId } },
      select: { id: true, emoji: true },
    }),
    db.reaction.groupBy({
      by: ["emoji"],
      where: { postId },
      _count: true,
    }),
  ]);

  const byEmoji: Record<string, number> = {};
  let total = 0;
  for (const c of counts) {
    byEmoji[c.emoji] = c._count;
    total += c._count;
  }

  return {
    userReaction: userReaction ? { id: userReaction.id, emoji: userReaction.emoji } : null,
    counts: { total, byEmoji },
  };
}

/** GET — check reaction state for a post */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const postId = request.nextUrl.searchParams.get("postId");

  if (!postId) {
    return NextResponse.json({ error: "postId is required" }, { status: 400 });
  }

  const state = await getReactionState(postId, userId);
  return NextResponse.json(state);
}

/** POST — add or change reaction (upsert) */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await request.json();
  const parsed = reactionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { postId, emoji } = parsed.data;

  await db.reaction.upsert({
    where: { userId_postId: { userId, postId } },
    create: { userId, postId, emoji },
    update: { emoji },
  });

  // Fire-and-forget notification to post owner
  const post = await db.post.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (post?.authorId) {
    const actorName = (session.user as { name?: string }).name ?? "Someone";
    notifyReaction(userId, actorName, post.authorId, postId, emoji).catch(() => {});
  }

  const state = await getReactionState(postId, userId);
  return NextResponse.json(state);
}

/** DELETE — remove reaction */
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await request.json();
  const parsed = reactionDeleteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { postId } = parsed.data;

  await db.reaction.deleteMany({
    where: { userId, postId },
  });

  const state = await getReactionState(postId, userId);
  return NextResponse.json(state);
}
