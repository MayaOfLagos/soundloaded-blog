import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import {
  RecommendationEntityType,
  RecommendationEventName,
  RecommendationSurface,
} from "@prisma/client";
import { trackInteractionEvent } from "@/lib/recommendation";

async function requireUser() {
  const session = await auth();
  if (!session?.user) return null;
  return session;
}

// ── GET — List hidden posts (paginated) ──
export async function GET(req: NextRequest) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

  const [hiddenPosts, total] = await Promise.all([
    db.hiddenPost.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            coverImage: true,
            type: true,
            isUserGenerated: true,
            createdAt: true,
            author: { select: { id: true, name: true, image: true } },
          },
        },
      },
    }),
    db.hiddenPost.count({ where: { userId } }),
  ]);

  return NextResponse.json({
    hiddenPosts,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

const hideSchema = z.object({
  postId: z.string().min(1),
});

// ── POST — Hide a post ──
export async function POST(req: NextRequest) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  try {
    const body = await req.json();
    const { postId } = hideSchema.parse(body);

    const existing = await db.hiddenPost.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      return NextResponse.json({ hidden: true, id: existing.id });
    }

    const hidden = await db.hiddenPost.create({
      data: { userId, postId },
    });
    trackInteractionEvent({
      eventName: RecommendationEventName.POST_HIDE,
      entityType: RecommendationEntityType.POST,
      entityId: postId,
      userId,
      surface: RecommendationSurface.FEED_FORYOU,
      weightHint: -10,
    });

    return NextResponse.json({ hidden: true, id: hidden.id }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 422 });
    }
    console.error("[POST /api/user/hidden-posts]", err);
    return NextResponse.json({ error: "Failed to hide post" }, { status: 500 });
  }
}

const unhideSchema = z.object({
  postId: z.string().min(1),
});

// ── DELETE — Unhide a post ──
export async function DELETE(req: NextRequest) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  try {
    const body = await req.json();
    const { postId } = unhideSchema.parse(body);

    await db.hiddenPost.deleteMany({
      where: { userId, postId },
    });

    return NextResponse.json({ hidden: false });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 422 });
    }
    console.error("[DELETE /api/user/hidden-posts]", err);
    return NextResponse.json({ error: "Failed to unhide post" }, { status: 500 });
  }
}
