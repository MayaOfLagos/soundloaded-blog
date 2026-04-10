import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { labelSchema } from "@/lib/validations/label";
import { z } from "zod";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  const label = await db.label.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { artists: true } },
    },
  });

  if (!label) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(label);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { id } = await params;

  try {
    const body = await req.json();
    const data = labelSchema.parse(body);

    const label = await db.label.update({
      where: { id },
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

    return NextResponse.json(label);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 422 });
    console.error("[PUT /api/admin/labels]", err);
    return NextResponse.json({ error: "Failed to update label" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { id } = await params;

  const label = await db.label.findUnique({
    where: { id },
    include: { _count: { select: { artists: true } } },
  });

  if (!label) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (label._count.artists > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete label with ${label._count.artists} artist(s). Remove or reassign them first.`,
      },
      { status: 409 }
    );
  }

  await db.label.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
