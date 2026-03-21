import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/** GET — creators you may know (not yet followed, sorted by follower count) */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const cursor = req.nextUrl.searchParams.get("cursor");
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || "20"), 50);
  const search = req.nextUrl.searchParams.get("q")?.trim();

  // Get IDs the user already follows
  const following = await db.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const followingIds = following.map((f) => f.followingId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conditions: any[] = [
    { id: { notIn: [userId, ...followingIds] } },
    { name: { not: null } },
    {
      OR: [
        { role: { in: ["CONTRIBUTOR", "EDITOR", "ADMIN", "SUPER_ADMIN"] } },
        { posts: { some: { status: "PUBLISHED" } } },
      ],
    },
  ];

  if (search) {
    conditions.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  const where = { AND: conditions };

  const suggestions = await db.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      bio: true,
      _count: { select: { followers: true, posts: true } },
    },
    orderBy: { followers: { _count: "desc" } },
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  const hasMore = suggestions.length > limit;
  const items = hasMore ? suggestions.slice(0, limit) : suggestions;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({
    suggestions: items.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      image: u.image,
      bio: u.bio,
      followerCount: u._count.followers,
      postCount: u._count.posts,
    })),
    nextCursor,
  });
}
