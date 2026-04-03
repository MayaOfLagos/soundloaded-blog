import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

if (!process.env.CLOUDFLARE_ACCOUNT_ID) {
  throw new Error("Missing CLOUDFLARE_ACCOUNT_ID");
}

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const MEDIA_BUCKET = process.env.R2_MEDIA_BUCKET ?? "soundloadedblog-media";
export const MUSIC_BUCKET = process.env.R2_MUSIC_BUCKET ?? "soundloadedblog-music";
export const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL ?? "";
export const MUSIC_CDN_URL = process.env.NEXT_PUBLIC_MUSIC_CDN_URL ?? "";

export async function getPresignedUploadUrl(
  bucket: string,
  key: string,
  contentType: string,
  expiresIn = 600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2Client, command, { expiresIn });
}

export async function getPresignedStreamUrl(
  bucket: string,
  key: string,
  expiresIn = 120
): Promise<string> {
  const { GetObjectCommand } = await import("@aws-sdk/client-s3");
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentDisposition: "inline",
  });
  return getSignedUrl(r2Client, command, { expiresIn });
}

export async function getPresignedDownloadUrl(
  bucket: string,
  key: string,
  filename: string,
  expiresIn = 300
): Promise<string> {
  const { GetObjectCommand } = await import("@aws-sdk/client-s3");
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${filename}"`,
  });
  return getSignedUrl(r2Client, command, { expiresIn });
}

export async function deleteFromR2(bucket: string, key: string): Promise<void> {
  await r2Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export function getMediaUrl(key: string): string {
  return `${CDN_URL}/${key}`;
}
