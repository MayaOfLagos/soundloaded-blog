import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [totalDownloads, monthDownloads, totalComments, totalBookmarks, totalFavorites] =
    await Promise.all([
      db.download.count({ where: { userId } }),
      db.download.count({
        where: { userId, createdAt: { gte: thirtyDaysAgo } },
      }),
      db.comment.count({ where: { authorId: userId } }),
      db.bookmark.count({ where: { userId } }),
      db.favorite.count({ where: { userId } }),
    ]);

  return NextResponse.json({
    totalDownloads,
    monthDownloads,
    totalComments,
    totalBookmarks,
    totalFavorites,
  });
}
