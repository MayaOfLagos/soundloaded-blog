import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const [profile, downloads, comments, bookmarks, favorites, transactions, preferences] =
    await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          email: true,
          image: true,
          bio: true,
          location: true,
          socialLinks: true,
          createdAt: true,
        },
      }),
      db.download.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { music: { select: { title: true, slug: true } } },
      }),
      db.comment.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { post: { select: { title: true, slug: true } } },
      }),
      db.bookmark.findMany({
        where: { userId },
        include: {
          post: { select: { title: true, slug: true } },
          music: { select: { title: true, slug: true } },
        },
      }),
      db.favorite.findMany({
        where: { userId },
        include: {
          post: { select: { title: true, slug: true } },
          music: { select: { title: true, slug: true } },
        },
      }),
      db.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      db.userPreferences.findUnique({ where: { userId } }),
    ]);

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    profile,
    downloads,
    comments,
    bookmarks,
    favorites,
    transactions,
    preferences,
  });
}
