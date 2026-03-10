import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createStorySchema } from "@/lib/validations/stories";

export interface StoryItemResponse {
  id: string;
  storyId: string;
  type: string;
  mediaUrl: string;
  caption: string | null;
  duration: number;
  createdAt: string;
  audioUrl: string | null;
  audioStartTime: number | null;
  audioEndTime: number | null;
  backgroundColor: string | null;
  textContent: string | null;
}

export interface StoryGroupResponse {
  author: { id: string; name: string | null; image: string | null };
  stories: StoryItemResponse[];
  hasUnviewed: boolean;
  latestAt: string;
}

/** GET — fetch active stories grouped by author */
export async function GET() {
  const session = await auth();
  const userId = session?.user ? (session.user as { id: string }).id : null;

  const now = new Date();

  // Build the author filter: own stories + followed users' stories
  // If not logged in, show stories from all creators
  let authorFilter = {};
  if (userId) {
    const following = await db.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);
    authorFilter = { authorId: { in: [userId, ...followingIds] } };
  }

  const stories = await db.story.findMany({
    where: {
      expiresAt: { gt: now },
      ...authorFilter,
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
      items: {
        orderBy: { order: "asc" },
        include: {
          views: userId ? { where: { viewerId: userId }, select: { id: true } } : false,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by author
  const grouped = new Map<string, StoryGroupResponse>();

  for (const story of stories) {
    const authorId = story.author.id;
    const existing = grouped.get(authorId);

    const storyItems: StoryItemResponse[] = story.items.map((item) => ({
      id: item.id,
      storyId: story.id,
      type: item.type,
      mediaUrl: item.mediaUrl,
      caption: item.caption,
      duration: item.duration,
      createdAt: item.createdAt.toISOString(),
      audioUrl: item.audioUrl,
      audioStartTime: item.audioStartTime,
      audioEndTime: item.audioEndTime,
      backgroundColor: item.backgroundColor,
      textContent: item.textContent,
    }));

    const hasUnviewedItems = userId
      ? story.items.some((item) => Array.isArray(item.views) && item.views.length === 0)
      : true;

    if (existing) {
      existing.stories.push(...storyItems);
      if (hasUnviewedItems) existing.hasUnviewed = true;
      if (story.createdAt.toISOString() > existing.latestAt) {
        existing.latestAt = story.createdAt.toISOString();
      }
    } else {
      grouped.set(authorId, {
        author: story.author,
        stories: storyItems,
        hasUnviewed: hasUnviewedItems,
        latestAt: story.createdAt.toISOString(),
      });
    }
  }

  // Sort: own stories first, then unviewed first, then by latest
  const result = Array.from(grouped.values()).sort((a, b) => {
    if (userId) {
      if (a.author.id === userId) return -1;
      if (b.author.id === userId) return 1;
    }
    if (a.hasUnviewed !== b.hasUnviewed) return a.hasUnviewed ? -1 : 1;
    return b.latestAt.localeCompare(a.latestAt);
  });

  return NextResponse.json({ storyGroups: result });
}

/** POST — create a new story */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authorId = (session.user as { id: string }).id;
  const body = await request.json();
  const parsed = createStorySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { items } = parsed.data;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const story = await db.story.create({
    data: {
      authorId,
      expiresAt,
      items: {
        create: items.map((item, index) => ({
          mediaUrl: item.mediaUrl,
          type: item.type as never,
          caption: item.caption ?? null,
          duration: item.duration ?? 5,
          order: index,
          audioUrl: item.audioUrl ?? null,
          audioStartTime: item.audioUrl ? item.audioStartTime : null,
          audioEndTime: item.audioUrl ? item.audioEndTime : null,
          backgroundColor: item.backgroundColor ?? null,
          textContent: item.textContent ?? null,
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json({ story });
}
