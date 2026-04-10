import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { labelSchema } from "@/lib/validations/label";
import { z } from "zod";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const q = searchParams.get("q");

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { country: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [labels, total] = await Promise.all([
    db.label.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { artists: true } },
      },
    }),
    db.label.count({ where }),
  ]);

  return NextResponse.json({ labels, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    const body = await req.json();
    const data = labelSchema.parse(body);

    const label = await db.label.create({
      data: {
        name: data.name,
        slug: data.slug,
        bio: data.bio ?? null,
        logo: data.logo || null,
        coverImage: data.coverImage || null,
        country: data.country || "Nigeria",
        website: data.website || null,
        instagram: data.instagram ?? null,
        twitter: data.twitter ?? null,
        facebook: data.facebook ?? null,
        spotify: data.spotify ?? null,
        appleMusic: data.appleMusic ?? null,
        verified: data.verified ?? false,
      },
    });

    return NextResponse.json(label, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 422 });
    console.error("[POST /api/admin/labels]", err);
    return NextResponse.json({ error: "Failed to create label" }, { status: 500 });
  }
}
