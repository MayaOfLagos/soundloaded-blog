import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { r2Client, getMediaUrl, MEDIA_BUCKET, MUSIC_BUCKET, MUSIC_CDN_URL } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";

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

function getExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "bin";
}

function getAllowedTypes(mediaType: string) {
  if (mediaType === "image") return ALLOWED_IMAGE_TYPES;
  if (mediaType === "video") return ALLOWED_VIDEO_TYPES;
  return ALLOWED_AUDIO_TYPES;
}

/** POST — upload story media directly through server to R2 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const mediaType = formData.get("mediaType") as string | null;
  const purpose = (formData.get("purpose") as string | null) ?? "stories";

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

  const ext = getExtension(file.name);
  const id = crypto.randomUUID();

  const isAudio = mediaType === "audio";
  const bucket = isAudio ? MUSIC_BUCKET : MEDIA_BUCKET;
  const folder = purpose === "posts" ? "posts" : "stories";
  const prefix = isAudio ? `${folder}/audio/${userId}` : `${folder}/${userId}`;
  const key = `${prefix}/${id}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })
  );

  const url = isAudio ? `${MUSIC_CDN_URL}/${key}` : getMediaUrl(key);

  return NextResponse.json({ url, key });
}
