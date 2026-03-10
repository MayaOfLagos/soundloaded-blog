import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

/** POST — follow a user */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const followerId = (session.user as { id: string }).id;
  const { userId } = await request.json();

  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  if (userId === followerId) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  try {
    await db.follow.create({
      data: { followerId, followingId: userId },
    });
    return NextResponse.json({ following: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ following: true }); // already following
    }
    throw err;
  }
}

/** DELETE — unfollow a user */
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const followerId = (session.user as { id: string }).id;
  const { userId } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  await db.follow.deleteMany({
    where: { followerId, followingId: userId },
  });

  return NextResponse.json({ following: false });
}

/** GET — check follow status or list followers/following */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUserId = (session.user as { id: string }).id;
  const { searchParams } = request.nextUrl;
  const checkUserId = searchParams.get("checkUserId");

  // Check if following a specific user
  if (checkUserId) {
    const follow = await db.follow.findUnique({
      where: {
        followerId_followingId: { followerId: currentUserId, followingId: checkUserId },
      },
    });
    return NextResponse.json({ following: !!follow });
  }

  // List followers/following
  const type = searchParams.get("type") ?? "following";
  const userId = searchParams.get("userId") ?? currentUserId;

  if (type === "followers") {
    const followers = await db.follow.findMany({
      where: { followingId: userId },
      include: { follower: { select: { id: true, name: true, image: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({
      users: followers.map((f) => f.follower),
      total: followers.length,
    });
  }

  const following = await db.follow.findMany({
    where: { followerId: userId },
    include: { following: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    users: following.map((f) => f.following),
    total: following.length,
  });
}
