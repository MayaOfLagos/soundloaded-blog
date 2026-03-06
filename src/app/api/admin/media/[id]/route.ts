import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteFromR2, MEDIA_BUCKET, MUSIC_BUCKET } from "@/lib/r2";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "EDITOR"];

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role ?? "";
  if (!session || !ADMIN_ROLES.includes(role)) return null;
  return session;
}

/**
 * GET /api/admin/media/[id] — Get single media item
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const media = await db.media.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true } } },
  });

  if (!media) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(media);
}

/**
 * PATCH /api/admin/media/[id] — Update metadata (alt, title, caption, folder)
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { alt, title, caption, folder } = body;

  const media = await db.media.update({
    where: { id },
    data: {
      ...(alt !== undefined && { alt }),
      ...(title !== undefined && { title }),
      ...(caption !== undefined && { caption }),
      ...(folder !== undefined && { folder }),
    },
  });

  return NextResponse.json(media);
}

/**
 * DELETE /api/admin/media/[id] — Delete from R2 + DB
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const media = await db.media.findUnique({ where: { id } });

  if (!media) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete from R2
  try {
    const bucket = media.type === "AUDIO" ? MUSIC_BUCKET : MEDIA_BUCKET;
    await deleteFromR2(bucket, media.r2Key);
  } catch (err) {
    console.error("[DELETE R2]", err);
    // Continue to delete DB record even if R2 deletion fails
  }

  await db.media.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
