import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const post = await db.post.findUnique({
      where: { slug, status: "PUBLISHED" },
      include: {
        author: { select: { name: true, image: true, email: true } },
        category: { select: { name: true, slug: true } },
        tags: { include: { tag: { select: { name: true, slug: true } } } },
        comments: {
          where: { status: "APPROVED", parentId: null },
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            author: { select: { name: true, image: true } },
            replies: {
              where: { status: "APPROVED" },
              include: { author: { select: { name: true, image: true } } },
            },
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Increment view count (fire-and-forget)
    db.post.update({ where: { id: post.id }, data: { views: { increment: 1 } } }).catch(() => {});

    return NextResponse.json({ post });
  } catch (err) {
    console.error(`[GET /api/posts/${slug}]`, err);
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}
