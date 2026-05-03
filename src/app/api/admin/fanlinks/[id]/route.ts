import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";

const adminUpdateSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  title: z.string().min(1).max(200).optional(),
  artistName: z.string().min(1).max(200).optional(),
  type: z.enum(["SINGLE", "ALBUM", "EP", "MIXTAPE"]).optional(),
  releaseDate: z.string().datetime().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  genre: z.string().max(100).optional().nullable(),
  coverArt: z.string().optional().nullable(),
  bgColor: z.string().optional().nullable(),
  accentColor: z.string().optional().nullable(),
  buttonStyle: z.enum(["filled", "outline", "pill"]).optional(),
  pageTheme: z.enum(["dark", "light", "auto"]).optional(),
  musicId: z.string().optional().nullable(),
  platformLinks: z.array(z.any()).optional(),
  emailCaptureEnabled: z.boolean().optional(),
  emailCapturePrompt: z.string().max(200).optional(),
  showSocialIcons: z.boolean().optional(),
  tipEnabled: z.boolean().optional(),
  tipLabel: z.string().max(100).optional(),
  tipAmounts: z.array(z.number().int().positive()).optional(),
  merchUrl: z.string().url().optional().nullable(),
  merchLabel: z.string().max(100).optional().nullable(),
  metaPixelId: z.string().optional().nullable(),
  gaId: z.string().optional().nullable(),
  ogImage: z.string().optional().nullable(),
  preSaveEnabled: z.boolean().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED", "SUSPENDED"]).optional(),
  adminNotes: z.string().optional().nullable(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { id } = await params;

  const fanlink = await db.fanlink.findUnique({
    where: { id },
    include: {
      artist: { select: { id: true, name: true, slug: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      _count: { select: { clicks: true, emails: true, tips: true } },
    },
  });

  if (!fanlink) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(fanlink);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { id } = await params;

  const fanlink = await db.fanlink.findUnique({ where: { id }, select: { id: true, slug: true } });
  if (!fanlink) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = adminUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const data = parsed.data;

  if (data.slug && data.slug !== fanlink.slug) {
    const existing = await db.fanlink.findUnique({ where: { slug: data.slug } });
    if (existing) return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
  }

  const updated = await db.fanlink.update({
    where: { id },
    data: {
      ...data,
      releaseDate: data.releaseDate
        ? new Date(data.releaseDate)
        : data.releaseDate === null
          ? null
          : undefined,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { id } = await params;

  const fanlink = await db.fanlink.findUnique({ where: { id }, select: { id: true } });
  if (!fanlink) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.fanlink.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
