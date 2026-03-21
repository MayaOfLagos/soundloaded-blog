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

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const status = searchParams.get("status"); // PENDING | APPROVED | REJECTED | null (all)
  const type = searchParams.get("type"); // ARTIST | LABEL | null (all)
  const q = searchParams.get("q");

  const where: Record<string, unknown> = {};

  if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
    where.status = status;
  }

  if (type && ["ARTIST", "LABEL"].includes(type)) {
    where.type = type;
  }

  if (q) {
    where.OR = [
      { displayName: { contains: q, mode: "insensitive" } },
      { user: { name: { contains: q, mode: "insensitive" } } },
      { user: { email: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [applications, total] = await Promise.all([
    db.creatorApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true, image: true, username: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
    }),
    db.creatorApplication.count({ where }),
  ]);

  return NextResponse.json({ applications, total, page, limit });
}
