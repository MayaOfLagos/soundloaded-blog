import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const status = searchParams.get("status");

  const where: Record<string, unknown> = { authorId: userId };
  if (status) {
    where.status = status;
  }

  const [comments, total] = await Promise.all([
    db.comment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        post: {
          select: {
            title: true,
            slug: true,
            category: { select: { slug: true } },
          },
        },
      },
    }),
    db.comment.count({ where }),
  ]);

  return NextResponse.json({
    comments,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
