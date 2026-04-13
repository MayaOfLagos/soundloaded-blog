import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { indexMusic } from "@/lib/meilisearch";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";

const createSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  artistId: z.string().min(1),
  albumId: z.string().optional().nullable(),
  genre: z.string().optional().nullable(),
  year: z.number().int().optional().nullable(),
  format: z.string().default("mp3"),
  r2Key: z.string().min(1),
  filename: z.string().min(1),
  fileSize: z.union([z.string(), z.number()]),
  duration: z.number().int().optional().nullable(),
  bitrate: z.number().int().optional().nullable(),
  trackNumber: z.number().int().optional().nullable(),
  coverArt: z.string().optional().nullable(),
  label: z.string().optional().nullable(),
  isExclusive: z.boolean().default(false),
  price: z.number().int().min(0).optional().nullable(),
  enableDownload: z.boolean().default(true),
  body: z.any().optional(),
});

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
          { title: { contains: q, mode: "insensitive" as const } },
          { artist: { name: { contains: q, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const [tracks, total] = await Promise.all([
    db.music.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        artist: { select: { id: true, name: true, slug: true } },
        album: { select: { id: true, title: true, slug: true } },
      },
    }),
    db.music.count({ where }),
  ]);

  return NextResponse.json({ tracks, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    // Find or create "Music" category for the companion post
    const musicCategory = await db.category.upsert({
      where: { slug: "music" },
      update: {},
      create: { name: "Music", slug: "music" },
    });

    // Ensure unique slug — append -2, -3, etc. if taken
    let slug = data.slug;
    const existing = await db.post.findUnique({ where: { slug }, select: { id: true } });
    if (existing) {
      let suffix = 2;
      while (
        await db.post.findUnique({
          where: { slug: `${data.slug}-${suffix}` },
          select: { id: true },
        })
      ) {
        suffix++;
      }
      slug = `${data.slug}-${suffix}`;
    }

    // Create a companion post for this music track
    const authorId = (session.user as { id?: string }).id!;
    const post = await db.post.create({
      data: {
        title: data.title,
        slug,
        body: data.body ?? {},
        status: "PUBLISHED",
        type: "MUSIC",
        publishedAt: new Date(),
        authorId,
        categoryId: musicCategory.id,
      },
    });

    const music = await db.music.create({
      data: {
        title: data.title,
        slug,
        r2Key: data.r2Key,
        filename: data.filename,
        fileSize: BigInt(data.fileSize as string | number),
        format: data.format,
        artistId: data.artistId,
        albumId: data.albumId ?? null,
        genre: data.genre ?? null,
        year: data.year ?? null,
        duration: data.duration ?? null,
        bitrate: data.bitrate ?? null,
        trackNumber: data.trackNumber ?? null,
        coverArt: data.coverArt ?? null,
        label: data.label ?? null,
        isExclusive: data.isExclusive,
        price: data.price ?? null,
        enableDownload: data.enableDownload,
        postId: post.id,
      },
      include: {
        artist: { select: { name: true, slug: true } },
        album: { select: { title: true, slug: true } },
      },
    });

    indexMusic(music);

    // Auto-enqueue audio processing job (transcode + normalize + waveform)
    try {
      await db.audioProcessingJob.create({
        data: {
          musicId: music.id,
          jobType: "full",
          status: "pending",
          priority: 0,
        },
      });
    } catch (enqueueErr) {
      // Non-fatal: track was created, processing can be retried later
      console.warn("[POST /api/admin/music] Failed to enqueue processing:", enqueueErr);
    }

    return NextResponse.json({ ...music, fileSize: music.fileSize.toString() }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 422 });
    console.error("[POST /api/admin/music]", err);
    return NextResponse.json({ error: "Failed to create music track" }, { status: 500 });
  }
}
