import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { getPresignedUploadUrl, MEDIA_BUCKET, MUSIC_BUCKET, CDN_URL } from "@/lib/r2";
import crypto from "crypto";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";

const mediaUploadSchema = z.object({
  filename: z.string().min(1).max(300),
  contentType: z.string().min(1),
  size: z
    .number()
    .int()
    .max(100 * 1024 * 1024)
    .optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  folder: z.string().max(200).optional(),
});

const ALLOWED_SORT_FIELDS = ["createdAt", "filename", "size", "type"];

// Image MIME types
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];

// Audio MIME types
const AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/flac",
  "audio/ogg",
  "audio/aac",
  "audio/x-m4a",
];

// Video MIME types
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

// Document types
const DOC_TYPES = ["application/pdf"];

const ALL_ALLOWED_TYPES = [...IMAGE_TYPES, ...AUDIO_TYPES, ...VIDEO_TYPES, ...DOC_TYPES];

function getMediaType(mimeType: string): "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT" {
  if (IMAGE_TYPES.includes(mimeType)) return "IMAGE";
  if (AUDIO_TYPES.includes(mimeType)) return "AUDIO";
  if (VIDEO_TYPES.includes(mimeType)) return "VIDEO";
  return "DOCUMENT";
}

function getBucket(mediaType: string): string {
  return mediaType === "AUDIO" ? MUSIC_BUCKET : MEDIA_BUCKET;
}

function resolveUrl(r2Key: string, mediaType: string): string {
  const cdn = mediaType === "AUDIO" ? (process.env.NEXT_PUBLIC_MUSIC_CDN_URL ?? "") : CDN_URL;
  return cdn ? `${cdn}/${r2Key}` : `/${r2Key}`;
}

/**
 * GET /api/admin/media — List media with pagination, filtering, search
 */
export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "40")));
  const type = searchParams.get("type"); // IMAGE, AUDIO, VIDEO, DOCUMENT
  const folder = searchParams.get("folder");
  const search = searchParams.get("search");
  const rawSort = searchParams.get("sort") ?? "createdAt";
  const sort = ALLOWED_SORT_FIELDS.includes(rawSort) ? rawSort : "createdAt";
  const order = searchParams.get("order") === "asc" ? "asc" : "desc";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (type) where.type = type;
  if (folder) where.folder = folder;
  if (search) {
    where.OR = [
      { filename: { contains: search, mode: "insensitive" } },
      { title: { contains: search, mode: "insensitive" } },
      { alt: { contains: search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    db.media.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { name: true, email: true } } },
    }),
    db.media.count({ where }),
  ]);

  return NextResponse.json({
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

/**
 * POST /api/admin/media — Get presigned upload URL + create DB record
 * Body: { filename, contentType, size, width?, height?, folder? }
 */
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { filename, contentType, size, width, height, folder } = mediaUploadSchema.parse(body);

    if (!ALL_ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json({ error: `Unsupported file type: ${contentType}` }, { status: 400 });
    }

    // Validate folder to prevent path traversal
    const safeFolder = (folder || "uploads")
      .replace(/\.\./g, "")
      .replace(/^\/+/, "")
      .replace(/[^a-zA-Z0-9_\-/]/g, "");

    const mediaType = getMediaType(contentType);
    const bucket = getBucket(mediaType);
    const ext = filename.split(".").pop() || "bin";
    const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    const prefix = mediaType === "AUDIO" ? "music" : "media";
    const r2Key = `${prefix}/${safeFolder}/${id}.${ext}`;
    const url = resolveUrl(r2Key, mediaType);

    // Get presigned URL
    const uploadUrl = await getPresignedUploadUrl(bucket, r2Key, contentType);

    // Verify the session user exists in the DB before linking
    const userId = session.user?.id ?? null;
    let validUserId: string | null = null;
    if (userId) {
      const userExists = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (userExists) validUserId = userId;
    }

    // Create DB record (status: pending until client confirms upload)
    const media = await db.media.create({
      data: {
        filename,
        r2Key,
        url,
        mimeType: contentType,
        size: size || 0,
        width: width || null,
        height: height || null,
        folder: folder || "",
        type: mediaType,
        uploadedBy: validUserId,
      },
    });

    return NextResponse.json({
      uploadUrl,
      media,
    });
  } catch (err) {
    console.error("[POST /api/admin/media]", err);
    return NextResponse.json({ error: "Failed to create upload" }, { status: 500 });
  }
}
