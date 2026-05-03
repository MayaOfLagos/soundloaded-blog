import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { id } = await params;

  const fanlink = await db.fanlink.findUnique({
    where: { id },
    select: { id: true, title: true, slug: true },
  });
  if (!fanlink) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const emails = await db.fanlinkEmail.findMany({
    where: { fanlinkId: id },
    orderBy: { createdAt: "desc" },
    select: { email: true, createdAt: true },
  });

  const rows = [
    "email,captured_at",
    ...emails.map((e) => `${e.email},${e.createdAt.toISOString()}`),
  ].join("\n");

  return new NextResponse(rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="fanlink-${fanlink.slug}-emails.csv"`,
    },
  });
}
