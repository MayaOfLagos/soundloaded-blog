import { NextRequest, NextResponse } from "next/server";
import { getPresignedUploadUrl, MEDIA_BUCKET } from "@/lib/r2";
import { z } from "zod";
import crypto from "crypto";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
] as const;

const UPLOAD_TYPES = [
  "logo-light",
  "logo-dark",
  "favicon",
  "og-image",
  "pwa-icon",
  "pwa-splash",
] as const;

const uploadSchema = z.object({
  type: z.enum(UPLOAD_TYPES),
  contentType: z.enum(ALLOWED_TYPES),
  filename: z.string().min(1).max(300),
  size: z
    .number()
    .int()
    .max(5 * 1024 * 1024, "File too large (max 5MB)")
    .optional(),
});

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { type, contentType, filename } = uploadSchema.parse(body);

    const ext = filename?.split(".").pop() || "png";
    const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    const r2Key = `settings/${type}/${id}.${ext}`;

    const uploadUrl = await getPresignedUploadUrl(MEDIA_BUCKET, r2Key, contentType);

    return NextResponse.json({ uploadUrl, r2Key });
  } catch (err) {
    console.error("[POST /api/admin/settings/upload]", err);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}
