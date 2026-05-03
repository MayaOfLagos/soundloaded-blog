import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "25", 10), 100);
  const q = searchParams.get("q");
  const status = searchParams.get("status");
  const artistId = searchParams.get("artistId");

  const where = {
    ...(status ? { status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SUSPENDED" } : {}),
    ...(artistId ? { artistId } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { slug: { contains: q, mode: "insensitive" as const } },
            { artistName: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [fanlinks, total] = await Promise.all([
    db.fanlink.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        artist: { select: { id: true, name: true, slug: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { clicks: true, emails: true, tips: true } },
      },
    }),
    db.fanlink.count({ where }),
  ]);

  return NextResponse.json({ fanlinks, total, page, limit });
}
