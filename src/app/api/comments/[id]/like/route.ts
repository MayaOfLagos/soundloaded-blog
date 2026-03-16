import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const likeSchema = z.object({
  type: z.enum(["LIKE", "DISLIKE"]),
});

// POST: Toggle like/dislike on a comment
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const { id: commentId } = await params;

  const body = await req.json();
  const parsed = likeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid type" }, { status: 422 });
  }

  const { type } = parsed.data;

  // Check if user already has a like on this comment
  const existing = await db.commentLike.findUnique({
    where: { userId_commentId: { userId, commentId } },
  });

  let userLike: string | null = null;

  if (existing) {
    if (existing.type === type) {
      // Same type — toggle off (remove)
      await db.commentLike.delete({ where: { id: existing.id } });
      userLike = null;
    } else {
      // Different type — switch
      await db.commentLike.update({
        where: { id: existing.id },
        data: { type },
      });
      userLike = type;
    }
  } else {
    // No existing — create
    await db.commentLike.create({
      data: { type, userId, commentId },
    });
    userLike = type;
  }

  // Get updated counts
  const [likeCount, dislikeCount] = await Promise.all([
    db.commentLike.count({ where: { commentId, type: "LIKE" } }),
    db.commentLike.count({ where: { commentId, type: "DISLIKE" } }),
  ]);

  return NextResponse.json({ userLike, likeCount, dislikeCount });
}
