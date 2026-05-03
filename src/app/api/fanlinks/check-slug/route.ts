import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const excludeId = searchParams.get("excludeId");

  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  if (!/^[a-z0-9-]{2,60}$/.test(slug)) {
    return NextResponse.json({ available: false, reason: "invalid" });
  }

  const existing = await db.fanlink.findFirst({
    where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    select: { id: true },
  });

  return NextResponse.json({ available: !existing });
}
