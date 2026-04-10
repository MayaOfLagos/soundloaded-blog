import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));

  const where = {
    type: "COMMUNITY" as const,
    isUserGenerated: true,
    ...(status && status !== "ALL" ? { status: status as never } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { excerpt: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [posts, total, statusCounts] = await Promise.all([
    db.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        status: true,
        views: true,
        coverImage: true,
        mediaAttachments: true,
        createdAt: true,
        publishedAt: true,
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
    }),
    db.post.count({ where }),
    db.post.groupBy({
      by: ["status"],
      where: { type: "COMMUNITY", isUserGenerated: true },
      _count: { _all: true },
    }),
  ]);

  const statusCountsMap: Record<string, number> = {};
  statusCounts.forEach((c) => {
    statusCountsMap[c.status] = c._count._all;
  });

  return NextResponse.json({
    posts,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    statusCounts: statusCountsMap,
  });
}
