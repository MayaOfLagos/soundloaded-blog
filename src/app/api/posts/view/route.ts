import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { Prisma } from "@prisma/client";

/**
 * POST /api/posts/view
 *
 * Facebook-style view tracking:
 * - Authenticated users: deduped via PostView table (unique per user+post)
 * - Guest users: deduped via Redis key (IP + postId, 24h TTL)
 * - Increments the Post.views counter on each unique view
 */
export async function POST(request: NextRequest) {
  try {
    const { postId } = await request.json();

    if (!postId || typeof postId !== "string") {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    const session = await auth();
    const userId = (session?.user as { id: string } | undefined)?.id;

    if (userId) {
      // Authenticated: use PostView table for deduplication
      try {
        await db.postView.create({
          data: { postId, viewerId: userId },
        });
        // New unique view — increment counter
        await db.post.update({
          where: { id: postId },
          data: { views: { increment: 1 } },
        });
      } catch (err) {
        // P2002 = unique constraint violation → already viewed
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          return NextResponse.json({ viewed: true, duplicate: true });
        }
        throw err;
      }
    } else {
      // Guest: use Redis for deduplication (24h window)
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown";

      const redisKey = `soundloadedblog:postview:${postId}:${ip}`;

      try {
        // SET NX (only if not exists) with 24h TTL
        const isNew = await redis.set(redisKey, "1", { nx: true, ex: 86400 });

        if (isNew) {
          // New unique view — increment counter
          await db.post.update({
            where: { id: postId },
            data: { views: { increment: 1 } },
          });
        } else {
          return NextResponse.json({ viewed: true, duplicate: true });
        }
      } catch {
        // Redis unavailable — fall through to increment anyway
        await db.post.update({
          where: { id: postId },
          data: { views: { increment: 1 } },
        });
      }
    }

    return NextResponse.json({ viewed: true });
  } catch (err) {
    console.error("[POST /api/posts/view]", err);
    return NextResponse.json({ error: "Failed to track view" }, { status: 500 });
  }
}
