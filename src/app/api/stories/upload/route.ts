import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storyUploadSchema } from "@/lib/validations/stories";
import {
  getPresignedUploadUrl,
  getMediaUrl,
  MEDIA_BUCKET,
  MUSIC_BUCKET,
  MUSIC_CDN_URL,
} from "@/lib/r2";

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

function getExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "bin";
}

/** POST — get presigned URL for story media upload */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await request.json();
  const parsed = storyUploadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { filename, contentType, mediaType } = parsed.data;

  // Validate content type
  const allowedTypes =
    mediaType === "image"
      ? ALLOWED_IMAGE_TYPES
      : mediaType === "video"
        ? ALLOWED_VIDEO_TYPES
        : ALLOWED_AUDIO_TYPES;

  if (!allowedTypes.includes(contentType)) {
    return NextResponse.json(
      { error: `Invalid content type for ${mediaType}: ${contentType}` },
      { status: 400 }
    );
  }

  const ext = getExtension(filename);
  const id = crypto.randomUUID();

  const isAudio = mediaType === "audio";
  const bucket = isAudio ? MUSIC_BUCKET : MEDIA_BUCKET;
  const prefix = isAudio ? `stories/audio/${userId}` : `stories/${userId}`;
  const key = `${prefix}/${id}.${ext}`;

  const uploadUrl = await getPresignedUploadUrl(bucket, key, contentType);
  const url = isAudio ? `${MUSIC_CDN_URL}/${key}` : getMediaUrl(key);

  return NextResponse.json({ uploadUrl, url, key });
}
