import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  Prisma,
  RecommendationEntityType,
  RecommendationEventName,
  RecommendationSurface,
} from "@prisma/client";
import { db } from "@/lib/db";
import { trackInteractionEvent } from "@/lib/recommendation";

/** POST — follow an artist */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { artistId } = await request.json();

  if (!artistId || typeof artistId !== "string") {
    return NextResponse.json({ error: "artistId is required" }, { status: 400 });
  }

  try {
    await db.artistFollow.create({ data: { userId, artistId } });
    trackInteractionEvent({
      eventName: RecommendationEventName.ARTIST_FOLLOW,
      entityType: RecommendationEntityType.ARTIST,
      entityId: artistId,
      userId,
      surface: RecommendationSurface.ARTIST_DETAIL,
      weightHint: 10,
    });
    const count = await db.artistFollow.count({ where: { artistId } });
    return NextResponse.json({ following: true, followerCount: count });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const count = await db.artistFollow.count({ where: { artistId } });
      return NextResponse.json({ following: true, followerCount: count });
    }
    throw err;
  }
}

/** DELETE — unfollow an artist */
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { artistId } = await request.json();

  if (!artistId || typeof artistId !== "string") {
    return NextResponse.json({ error: "artistId is required" }, { status: 400 });
  }

  const deleted = await db.artistFollow.deleteMany({ where: { userId, artistId } });
  if (deleted.count > 0) {
    trackInteractionEvent({
      eventName: RecommendationEventName.ARTIST_UNFOLLOW,
      entityType: RecommendationEntityType.ARTIST,
      entityId: artistId,
      userId,
      surface: RecommendationSurface.ARTIST_DETAIL,
      weightHint: -4,
    });
  }
  const count = await db.artistFollow.count({ where: { artistId } });

  return NextResponse.json({ following: false, followerCount: count });
}

/** GET — check follow status + follower count */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const artistId = searchParams.get("artistId");

  if (!artistId) {
    return NextResponse.json({ error: "artistId is required" }, { status: 400 });
  }

  const count = await db.artistFollow.count({ where: { artistId } });

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ following: false, followerCount: count });
  }

  const userId = (session.user as { id: string }).id;
  const follow = await db.artistFollow.findUnique({
    where: { userId_artistId: { userId, artistId } },
  });

  return NextResponse.json({ following: !!follow, followerCount: count });
}
