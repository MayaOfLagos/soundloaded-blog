import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const platformLinkSchema = z.object({
  platform: z.string().min(1),
  url: z.string().url(),
  label: z.string().optional(),
  isEnabled: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

const updateSchema = z.object({
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
  platformLinks: z.array(platformLinkSchema).optional(),
  emailCaptureEnabled: z.boolean().optional(),
  emailCapturePrompt: z.string().max(200).optional(),
  showSocialIcons: z.boolean().optional(),
  tipEnabled: z.boolean().optional(),
  tipLabel: z.string().max(100).optional(),
  tipAmounts: z.array(z.number().int().positive()).optional(),
  merchUrl: z.string().url().optional().nullable(),
  merchLabel: z.string().max(100).optional().nullable(),
  preSaveEnabled: z.boolean().optional(),
  preSaveSpotifyUrl: z.string().optional().nullable(),
  preSaveAppleUrl: z.string().optional().nullable(),
  preSaveDeezerUrl: z.string().optional().nullable(),
  preSaveMessage: z.string().max(200).optional(),
  fanGateEnabled: z.boolean().optional(),
  fanGateAction: z.enum(["follow", "share", "both"]).optional(),
  fanGateSpotifyUrl: z.string().optional().nullable(),
  fanGateTwitterText: z.string().max(280).optional().nullable(),
  abEnabled: z.boolean().optional(),
  abSplit: z.number().int().min(0).max(100).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

async function getOwnedFanlink(id: string, userId: string) {
  return db.fanlink.findFirst({ where: { id, createdById: userId } });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  const fanlink = await db.fanlink.findFirst({
    where: { id, createdById: userId },
    include: { artist: { select: { id: true, name: true, slug: true } } },
  });

  if (!fanlink) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(fanlink);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  const fanlink = await getOwnedFanlink(id, userId);
  if (!fanlink) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (fanlink.status === "SUSPENDED") {
    return NextResponse.json(
      { error: "This fanlink has been suspended by an admin" },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
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
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  const fanlink = await getOwnedFanlink(id, userId);
  if (!fanlink) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (fanlink.status === "SUSPENDED") {
    return NextResponse.json({ error: "Cannot delete a suspended fanlink" }, { status: 403 });
  }

  await db.fanlink.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
