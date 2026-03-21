import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { indexMusic } from "@/lib/meilisearch";
import { z } from "zod";

const artistMusicSchema = z.object({
  title: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
  albumId: z.string().optional(),
  genre: z.string().optional(),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  format: z.enum(["MP3", "FLAC", "WAV", "AAC", "OGG"]),
  r2Key: z.string().min(1),
  filename: z.string().min(1),
  fileSize: z.coerce.number().int().positive(),
  duration: z.coerce.number().int().positive().optional(),
  bitrate: z.coerce.number().int().positive().optional(),
  trackNumber: z.coerce.number().int().positive().optional(),
  coverArt: z.string().url().optional().or(z.literal("")),
  label: z.string().optional(),
  isExclusive: z.boolean().default(false),
  enableDownload: z.boolean().default(true),
});

async function requireArtist() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const artistProfileId = (session.user as { artistProfileId?: string | null }).artistProfileId;
  if (!artistProfileId) return null;
  return { session, artistProfileId };
}

export async function GET(req: NextRequest) {
  const result = await requireArtist();
  if (!result) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const where = { artistId: result.artistProfileId };

  const [tracks, total] = await Promise.all([
    db.music.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        album: { select: { id: true, title: true, slug: true } },
      },
    }),
    db.music.count({ where }),
  ]);

  // Convert BigInt to string for JSON serialization
  const serialized = tracks.map((t) => ({
    ...t,
    fileSize: t.fileSize.toString(),
  }));

  return NextResponse.json({ tracks: serialized, total, page, limit });
}

export async function POST(req: NextRequest) {
  const result = await requireArtist();
  if (!result) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = artistMusicSchema.parse(body);

    // Handle slug collision
    let finalSlug = data.slug;
    let existing = await db.music.findUnique({ where: { slug: finalSlug } });
    let counter = 2;
    while (existing) {
      finalSlug = `${data.slug}-${counter}`;
      existing = await db.music.findUnique({ where: { slug: finalSlug } });
      counter++;
    }

    // Get or create "Music" category
    let musicCategory = await db.category.findFirst({ where: { slug: "music" } });
    if (!musicCategory) {
      musicCategory = await db.category.create({
        data: { name: "Music", slug: "music" },
      });
    }

    // Create companion Post + Music atomically
    const music = await db.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          title: data.title,
          slug: `music-${finalSlug}`,
          body: {},
          type: "MUSIC",
          status: "PUBLISHED",
          publishedAt: new Date(),
          authorId: result.session.user.id,
          categoryId: musicCategory!.id,
          enableDownload: data.enableDownload,
        },
      });

      const track = await tx.music.create({
        data: {
          title: data.title,
          slug: finalSlug,
          r2Key: data.r2Key,
          filename: data.filename,
          fileSize: BigInt(data.fileSize),
          format: data.format.toLowerCase(),
          duration: data.duration ?? null,
          bitrate: data.bitrate ?? null,
          year: data.year ?? null,
          genre: data.genre ?? null,
          label: data.label ?? null,
          trackNumber: data.trackNumber ?? null,
          coverArt: data.coverArt || null,
          isExclusive: data.isExclusive,
          enableDownload: data.enableDownload,
          artistId: result.artistProfileId,
          albumId: data.albumId || null,
          postId: post.id,
        },
      });

      return track;
    });

    indexMusic(music);

    return NextResponse.json({ ...music, fileSize: music.fileSize.toString() }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 422 });
    console.error("[POST /api/artist/music]", err);
    return NextResponse.json({ error: "Failed to upload music" }, { status: 500 });
  }
}
