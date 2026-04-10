import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50")));

  const [subscribers, total, confirmed, pending, unsubscribed] = await Promise.all([
    db.subscriber.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    db.subscriber.count(),
    db.subscriber.count({ where: { status: "CONFIRMED" } }),
    db.subscriber.count({ where: { status: "PENDING" } }),
    db.subscriber.count({ where: { status: "UNSUBSCRIBED" } }),
  ]);

  return NextResponse.json({
    subscribers,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    stats: {
      confirmed,
      pending,
      unsubscribed,
      total: confirmed + pending + unsubscribed,
    },
  });
}
