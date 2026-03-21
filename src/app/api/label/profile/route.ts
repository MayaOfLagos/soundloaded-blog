import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateLabelProfileSchema = z.object({
  name: z.string().min(1).optional(),
  bio: z.string().optional().nullable(),
  logo: z.string().url().optional().nullable().or(z.literal("")),
  coverImage: z.string().url().optional().nullable().or(z.literal("")),
  country: z.string().optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal("")),
  instagram: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  spotify: z.string().optional().nullable(),
  appleMusic: z.string().optional().nullable(),
});

async function requireLabel() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const labelProfileId = (session.user as { labelProfileId?: string | null }).labelProfileId;
  if (!labelProfileId) return null;
  return { session, labelProfileId };
}

export async function GET() {
  const result = await requireLabel();
  if (!result) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const label = await db.label.findUnique({
    where: { id: result.labelProfileId },
    include: {
      _count: { select: { artists: true } },
    },
  });

  if (!label) return NextResponse.json({ error: "Label profile not found" }, { status: 404 });
  return NextResponse.json(label);
}

export async function PUT(req: NextRequest) {
  const result = await requireLabel();
  if (!result) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = updateLabelProfileSchema.parse(body);

    const label = await db.label.update({
      where: { id: result.labelProfileId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        bio: data.bio ?? undefined,
        logo: data.logo || undefined,
        coverImage: data.coverImage || undefined,
        country: data.country || undefined,
        website: data.website || undefined,
        instagram: data.instagram ?? undefined,
        twitter: data.twitter ?? undefined,
        facebook: data.facebook ?? undefined,
        spotify: data.spotify ?? undefined,
        appleMusic: data.appleMusic ?? undefined,
      },
    });

    return NextResponse.json(label);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 422 });
    console.error("[PUT /api/label/profile]", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
