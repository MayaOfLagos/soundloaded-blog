import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPresignedUploadUrl, MEDIA_BUCKET } from "@/lib/r2";
import crypto from "crypto";

const SETTINGS_ROLES = ["ADMIN", "SUPER_ADMIN"];

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
];

const UPLOAD_TYPES = [
  "logo-light",
  "logo-dark",
  "favicon",
  "og-image",
  "pwa-icon",
  "pwa-splash",
] as const;

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role ?? "";
  if (!session || !SETTINGS_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { type, contentType, filename } = await req.json();

    if (!UPLOAD_TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid upload type" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

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
