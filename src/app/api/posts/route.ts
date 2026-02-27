import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "12", 10), 50);
  const category = searchParams.get("category") ?? undefined;
  const type = searchParams.get("type") ?? undefined;
  const q = searchParams.get("q") ?? undefined;

  try {
    const where = {
      status: "PUBLISHED" as const,
      ...(category ? { category: { slug: category } } : {}),
      ...(type ? { type: type as never } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" as const } },
              { excerpt: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [posts, total] = await Promise.all([
      db.post.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          coverImage: true,
          publishedAt: true,
          views: true,
          type: true,
          category: { select: { name: true, slug: true } },
          author: { select: { name: true, image: true } },
        },
      }),
      db.post.count({ where }),
    ]);

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
      },
    });
  } catch (err) {
    console.error("[GET /api/posts]", err);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}
