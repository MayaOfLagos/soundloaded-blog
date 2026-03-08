import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));

  const where = { userId };

  const [notifications, total] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.notification.count({ where }),
  ]);

  return NextResponse.json({
    notifications,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await request.json();
  const { id, markAllRead } = body as { id?: string; markAllRead?: boolean };

  if (markAllRead) {
    await db.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  } else if (id) {
    await db.notification.update({
      where: { id, userId },
      data: { read: true },
    });
  } else {
    return NextResponse.json({ error: "Provide id or markAllRead" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
