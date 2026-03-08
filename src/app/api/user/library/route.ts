import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const POST_TYPE_MAP: Record<string, string> = {
  music: "MUSIC",
  news: "NEWS",
  gist: "GIST",
  videos: "VIDEO",
};

interface LibraryItem {
  id: string;
  savedAs: "bookmarked" | "favorited" | "both";
  savedAt: Date;
  postId: string | null;
  musicId: string | null;
  post: Record<string, unknown> | null;
  music: Record<string, unknown> | null;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const tab = searchParams.get("tab") || "all";
  const sort = searchParams.get("sort") || "newest";

  const postInclude = {
    select: {
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      type: true,
      category: { select: { name: true, slug: true } },
    },
  };

  const musicInclude = {
    select: {
      title: true,
      slug: true,
      coverArt: true,
      artist: { select: { name: true } },
    },
  };

  const [bookmarks, favorites] = await Promise.all([
    db.bookmark.findMany({
      where: { userId },
      include: { post: postInclude, music: musicInclude },
    }),
    db.favorite.findMany({
      where: { userId },
      include: { post: postInclude, music: musicInclude },
    }),
  ]);

  // Merge and deduplicate
  const itemMap = new Map<string, LibraryItem>();

  for (const b of bookmarks) {
    const key = b.postId ? `post:${b.postId}` : `music:${b.musicId}`;
    itemMap.set(key, {
      id: b.id,
      savedAs: "bookmarked",
      savedAt: b.createdAt,
      postId: b.postId,
      musicId: b.musicId,
      post: b.post as Record<string, unknown> | null,
      music: b.music as Record<string, unknown> | null,
    });
  }

  for (const f of favorites) {
    const key = f.postId ? `post:${f.postId}` : `music:${f.musicId}`;
    const existing = itemMap.get(key);
    if (existing) {
      existing.savedAs = "both";
      if (f.createdAt > existing.savedAt) {
        existing.savedAt = f.createdAt;
      }
    } else {
      itemMap.set(key, {
        id: f.id,
        savedAs: "favorited",
        savedAt: f.createdAt,
        postId: f.postId,
        musicId: f.musicId,
        post: f.post as Record<string, unknown> | null,
        music: f.music as Record<string, unknown> | null,
      });
    }
  }

  let items = Array.from(itemMap.values());

  // Filter by tab
  if (tab !== "all" && POST_TYPE_MAP[tab]) {
    const postType = POST_TYPE_MAP[tab];
    items = items.filter(
      (item) => item.post && (item.post as Record<string, unknown>).type === postType
    );
  }

  // Sort
  items.sort((a, b) => {
    const diff = b.savedAt.getTime() - a.savedAt.getTime();
    return sort === "oldest" ? -diff : diff;
  });

  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const paged = items.slice((page - 1) * limit, page * limit);

  return NextResponse.json({
    items: paged,
    total,
    page,
    totalPages,
  });
}
