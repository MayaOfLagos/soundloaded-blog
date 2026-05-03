import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  const fanlink = await db.fanlink.findFirst({
    where: { id, createdById: userId },
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

  const filename = `fanlink-${fanlink.slug}-emails.csv`;

  return new NextResponse(rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
