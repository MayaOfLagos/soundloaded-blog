import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role ?? "";
  if (!session || !ADMIN_ROLES.includes(role)) return null;
  return session;
}

export async function GET(_req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [subscribers, confirmed, pending, unsubscribed] = await Promise.all([
    db.subscriber.findMany({
      orderBy: { createdAt: "desc" },
      take: 1000,
    }),
    db.subscriber.count({ where: { status: "CONFIRMED" } }),
    db.subscriber.count({ where: { status: "PENDING" } }),
    db.subscriber.count({ where: { status: "UNSUBSCRIBED" } }),
  ]);

  return NextResponse.json({
    subscribers,
    stats: {
      confirmed,
      pending,
      unsubscribed,
      total: confirmed + pending + unsubscribed,
    },
  });
}
