import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPresignedUploadUrl, MEDIA_BUCKET, CDN_URL } from "@/lib/r2";
import crypto from "crypto";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await request.json();
  const { filename, contentType } = body as { filename: string; contentType: string };

  if (!filename || !contentType) {
    return NextResponse.json({ error: "filename and contentType are required" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json(
      { error: "Only PNG, JPEG, and WebP images are allowed" },
      { status: 400 }
    );
  }

  const ext = filename.split(".").pop() || "jpg";
  const key = `avatars/${userId}/${crypto.randomUUID()}.${ext}`;

  const uploadUrl = await getPresignedUploadUrl(MEDIA_BUCKET, key, contentType);
  const url = CDN_URL ? `${CDN_URL}/${key}` : `/${key}`;

  return NextResponse.json({ uploadUrl, url, key });
}
