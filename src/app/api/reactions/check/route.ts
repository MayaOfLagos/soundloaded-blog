import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/** GET — batch check reactions for multiple posts */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const postIdsParam = request.nextUrl.searchParams.get("postIds");

  if (!postIdsParam) {
    return NextResponse.json({ error: "postIds is required" }, { status: 400 });
  }

  const postIds = postIdsParam.split(",").filter(Boolean).slice(0, 50);

  const reactions = await db.reaction.findMany({
    where: { userId, postId: { in: postIds } },
    select: { id: true, emoji: true, postId: true },
  });

  const map: Record<string, { id: string; emoji: string }> = {};
  for (const r of reactions) {
    map[r.postId] = { id: r.id, emoji: r.emoji };
  }

  return NextResponse.json({ reactions: map });
}
