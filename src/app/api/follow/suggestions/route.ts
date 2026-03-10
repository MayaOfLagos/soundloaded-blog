import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/** GET — creators you may know (not yet followed, sorted by follower count) */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  // Get IDs the user already follows
  const following = await db.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const followingIds = following.map((f) => f.followingId);

  // Find users not followed, exclude self, with most followers first
  const suggestions = await db.user.findMany({
    where: {
      id: { notIn: [userId, ...followingIds] },
      role: { in: ["CONTRIBUTOR", "EDITOR", "ADMIN", "SUPER_ADMIN"] },
    },
    select: {
      id: true,
      name: true,
      image: true,
      bio: true,
      _count: { select: { followers: true, posts: true } },
    },
    orderBy: { followers: { _count: "desc" } },
    take: 20,
  });

  return NextResponse.json({
    suggestions: suggestions.map((u) => ({
      id: u.id,
      name: u.name,
      image: u.image,
      bio: u.bio,
      followerCount: u._count.followers,
      postCount: u._count.posts,
    })),
  });
}
