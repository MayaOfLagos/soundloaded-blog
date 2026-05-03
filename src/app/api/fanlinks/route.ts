import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const platformLinkSchema = z.object({
  platform: z.string().min(1),
  url: z.string().url("Must be a valid URL"),
  label: z.string().optional(),
  isEnabled: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

const createSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  title: z.string().min(1).max(200),
  artistName: z.string().min(1).max(200),
  type: z.enum(["SINGLE", "ALBUM", "EP", "MIXTAPE"]).default("SINGLE"),
  releaseDate: z.string().datetime().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  genre: z.string().max(100).optional().nullable(),
  coverArt: z.string().optional().nullable(),
  bgColor: z.string().optional().nullable(),
  accentColor: z.string().optional().nullable(),
  buttonStyle: z.enum(["filled", "outline", "pill"]).default("filled"),
  pageTheme: z.enum(["dark", "light", "auto"]).default("dark"),
  musicId: z.string().optional().nullable(),
  platformLinks: z.array(platformLinkSchema).default([]),
  emailCaptureEnabled: z.boolean().default(false),
  emailCapturePrompt: z.string().max(200).default("Enter your email to unlock"),
  showSocialIcons: z.boolean().default(true),
  tipEnabled: z.boolean().default(false),
  tipLabel: z.string().max(100).default("Support this artist"),
  tipAmounts: z.array(z.number().int().positive()).default([200, 500, 1000]),
  merchUrl: z.string().url().optional().nullable(),
  merchLabel: z.string().max(100).optional().nullable(),
  preSaveEnabled: z.boolean().default(false),
  preSaveSpotifyUrl: z.string().optional().nullable(),
  preSaveAppleUrl: z.string().optional().nullable(),
  preSaveDeezerUrl: z.string().optional().nullable(),
  preSaveMessage: z.string().max(200).default("Save this track before it drops!"),
  fanGateEnabled: z.boolean().default(false),
  fanGateAction: z.enum(["follow", "share", "both"]).default("follow"),
  fanGateSpotifyUrl: z.string().optional().nullable(),
  fanGateTwitterText: z.string().max(280).optional().nullable(),
  abEnabled: z.boolean().default(false),
  abSplit: z.number().int().min(0).max(100).default(50),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  const artist = await db.artist.findUnique({ where: { ownerId: userId }, select: { id: true } });
  const label = await db.label.findUnique({ where: { ownerId: userId }, select: { id: true } });

  if (!artist && !label) {
    return NextResponse.json({ error: "Creator profile required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);
  const status = searchParams.get("status") ?? undefined;

  const where = {
    createdById: userId,
    ...(status ? { status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED" } : {}),
  };

  const [fanlinks, total] = await Promise.all([
    db.fanlink.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
      select: {
        id: true,
        slug: true,
        title: true,
        artistName: true,
        type: true,
        coverArt: true,
        status: true,
        totalClicks: true,
        uniqueVisitors: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { emails: true } },
      },
    }),
    db.fanlink.count({ where }),
  ]);

  return NextResponse.json({ fanlinks, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  const artist = await db.artist.findUnique({ where: { ownerId: userId } });
  if (!artist) {
    return NextResponse.json(
      { error: "Artist profile required to create fanlinks" },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const data = parsed.data;

  const existing = await db.fanlink.findUnique({ where: { slug: data.slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
  }

  const fanlink = await db.fanlink.create({
    data: {
      slug: data.slug,
      title: data.title,
      artistName: data.artistName,
      type: data.type,
      releaseDate: data.releaseDate ? new Date(data.releaseDate) : null,
      description: data.description,
      genre: data.genre,
      coverArt: data.coverArt,
      bgColor: data.bgColor,
      accentColor: data.accentColor,
      buttonStyle: data.buttonStyle,
      pageTheme: data.pageTheme,
      musicId: data.musicId,
      artistId: artist.id,
      createdById: userId,
      platformLinks: data.platformLinks,
      emailCaptureEnabled: data.emailCaptureEnabled,
      emailCapturePrompt: data.emailCapturePrompt,
      showSocialIcons: data.showSocialIcons,
      tipEnabled: data.tipEnabled,
      tipLabel: data.tipLabel,
      tipAmounts: data.tipAmounts,
      merchUrl: data.merchUrl,
      merchLabel: data.merchLabel,
      status: data.status,
    },
  });

  return NextResponse.json(fanlink, { status: 201 });
}
