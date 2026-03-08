import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bookmarkSchema } from "@/lib/validations/user";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const type = searchParams.get("type") as "post" | "music" | null;
  const sort = searchParams.get("sort") || "newest";

  const where: Prisma.BookmarkWhereInput = { userId };
  if (type === "post") where.postId = { not: null };
  if (type === "music") where.musicId = { not: null };

  const [bookmarks, total] = await Promise.all([
    db.bookmark.findMany({
      where,
      include: {
        post: {
          select: {
            title: true,
            slug: true,
            excerpt: true,
            coverImage: true,
            type: true,
            category: { select: { name: true, slug: true } },
          },
        },
        music: {
          select: {
            title: true,
            slug: true,
            coverArt: true,
            artist: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: sort === "oldest" ? "asc" : "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.bookmark.count({ where }),
  ]);

  return NextResponse.json({
    bookmarks,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await request.json();
  const parsed = bookmarkSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const bookmark = await db.bookmark.create({
      data: {
        userId,
        postId: parsed.data.postId,
        musicId: parsed.data.musicId,
      },
    });

    return NextResponse.json({ bookmark }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Already bookmarked" }, { status: 409 });
    }
    throw error;
  }
}
