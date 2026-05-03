import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { r2Client, getMediaUrl, MEDIA_BUCKET, MUSIC_BUCKET, MUSIC_CDN_URL } from "@/lib/r2";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { db } from "@/lib/db";

const ratelimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(10, "1 h"),
        prefix: "ratelimit:stories-upload",
      })
    : null;

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/ogg",
  "audio/x-m4a",
  "audio/aac",
];

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/wav": "wav",
  "audio/ogg": "ogg",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
};

const WATERMARK_GRAVITY: Record<string, string> = {
  center: "centre",
  "top-left": "northwest",
  "top-right": "northeast",
  "bottom-left": "southwest",
  "bottom-right": "southeast",
};

function getSafeExtension(mimeType: string, filename: string): string {
  return MIME_TO_EXT[mimeType] ?? filename.split(".").pop()?.toLowerCase() ?? "bin";
}

function getAllowedTypes(mediaType: string) {
  if (mediaType === "image") return ALLOWED_IMAGE_TYPES;
  if (mediaType === "video") return ALLOWED_VIDEO_TYPES;
  return ALLOWED_AUDIO_TYPES;
}

async function downloadR2Buffer(key: string): Promise<Buffer> {
  const response = await r2Client.send(new GetObjectCommand({ Bucket: MEDIA_BUCKET, Key: key }));
  const bytes = await response.Body?.transformToByteArray();
  if (!bytes) throw new Error("Empty R2 response");
  return Buffer.from(bytes);
}

async function processImage(
  inputBuffer: Buffer,
  settings: {
    imageQuality: number;
    largeImageSize: number;
    enableWatermark: boolean;
    watermarkImage: string | null;
    watermarkPosition: string;
  }
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  const sharp = (await import("sharp")).default;

  const composites: import("sharp").OverlayOptions[] = [];

  if (settings.enableWatermark && settings.watermarkImage) {
    try {
      // watermarkImage may be an R2 key or a full URL
      let wmBuffer: Buffer;
      if (settings.watermarkImage.startsWith("http")) {
        const res = await fetch(settings.watermarkImage);
        wmBuffer = Buffer.from(await res.arrayBuffer());
      } else {
        wmBuffer = await downloadR2Buffer(settings.watermarkImage);
      }

      const meta = await sharp(inputBuffer).metadata();
      const wmWidth = Math.max(40, Math.round((meta.width ?? 800) * 0.18));
      const wmResized = await sharp(wmBuffer).resize(wmWidth).toBuffer();

      composites.push({
        input: wmResized,
        gravity: (WATERMARK_GRAVITY[settings.watermarkPosition] ?? "southeast") as never,
        blend: "over",
      });
    } catch {
      // Watermark failure must never block the upload
    }
  }

  let pipeline = sharp(inputBuffer).resize(settings.largeImageSize, settings.largeImageSize, {
    fit: "inside",
    withoutEnlargement: true,
  });

  if (composites.length > 0) {
    pipeline = pipeline.composite(composites);
  }

  const buffer = await pipeline.webp({ quality: settings.imageQuality }).toBuffer();
  return { buffer, contentType: "image/webp", ext: "webp" };
}

/** POST — upload story media directly through server to R2 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  if (ratelimit) {
    const { success } = await ratelimit.limit(userId);
    if (!success) {
      return NextResponse.json(
        { error: "Too many uploads. Please try again later." },
        { status: 429 }
      );
    }
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const mediaType = formData.get("mediaType") as string | null;
  const rawPurpose = (formData.get("purpose") as string | null) ?? "stories";
  const purpose = ["stories", "posts"].includes(rawPurpose) ? rawPurpose : "stories";

  if (!file || !mediaType) {
    return NextResponse.json({ error: "Missing file or mediaType" }, { status: 400 });
  }

  if (!["image", "video", "audio"].includes(mediaType)) {
    return NextResponse.json({ error: "Invalid mediaType" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
  }

  const allowedTypes = getAllowedTypes(mediaType);
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: `Invalid content type for ${mediaType}: ${file.type}` },
      { status: 400 }
    );
  }

  const id = crypto.randomUUID();
  const isAudio = mediaType === "audio";
  const isImage = mediaType === "image";
  const bucket = isAudio ? MUSIC_BUCKET : MEDIA_BUCKET;
  const folder = purpose === "posts" ? "posts" : "stories";

  let buffer: Buffer = Buffer.from(await file.arrayBuffer()) as Buffer;
  let contentType = file.type;
  let ext = getSafeExtension(file.type, file.name);

  // Apply Sharp processing for images
  if (isImage && file.type !== "image/gif") {
    try {
      const siteSettings = await db.siteSettings.findUnique({
        where: { id: "default" },
        select: {
          imageQuality: true,
          largeImageSize: true,
          enableWatermark: true,
          watermarkImage: true,
          watermarkPosition: true,
        },
      });

      const processed = await processImage(buffer, {
        imageQuality: siteSettings?.imageQuality ?? 80,
        largeImageSize: siteSettings?.largeImageSize ?? 1200,
        enableWatermark: siteSettings?.enableWatermark ?? false,
        watermarkImage: siteSettings?.watermarkImage ?? null,
        watermarkPosition: siteSettings?.watermarkPosition ?? "bottom-right",
      });

      buffer = processed.buffer;
      contentType = processed.contentType;
      ext = processed.ext;
    } catch {
      // Processing failure — upload original file unchanged
    }
  }

  const prefix = isAudio ? `${folder}/audio/${userId}` : `${folder}/${userId}`;
  const key = `${prefix}/${id}.${ext}`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  const url = isAudio ? `${MUSIC_CDN_URL}/${key}` : getMediaUrl(key);
  return NextResponse.json({ url, key });
}
