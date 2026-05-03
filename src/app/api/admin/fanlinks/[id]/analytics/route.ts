import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { id } = await params;

  const fanlink = await db.fanlink.findUnique({
    where: { id },
    select: { id: true, title: true, totalClicks: true, uniqueVisitors: true },
  });
  if (!fanlink) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [clicksByPlatform, clicksByDevice, clicksByCountry, clicksOverTime, emailCount] =
    await Promise.all([
      db.fanlinkClick.groupBy({
        by: ["platform"],
        where: { fanlinkId: id },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
      db.fanlinkClick.groupBy({
        by: ["device"],
        where: { fanlinkId: id },
        _count: { id: true },
      }),
      db.fanlinkClick.groupBy({
        by: ["country"],
        where: { fanlinkId: id, country: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      db.fanlinkClick.findMany({
        where: { fanlinkId: id, createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true, platform: true },
        orderBy: { createdAt: "asc" },
      }),
      db.fanlinkEmail.count({ where: { fanlinkId: id } }),
    ]);

  return NextResponse.json({
    fanlink,
    clicksByPlatform,
    clicksByDevice,
    clicksByCountry,
    clicksOverTime,
    emailCount,
  });
}
