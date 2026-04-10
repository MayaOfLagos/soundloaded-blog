import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { deleteFromR2, MEDIA_BUCKET, MUSIC_BUCKET } from "@/lib/r2";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";

const mediaPatchSchema = z
  .object({
    alt: z.string().max(500).optional(),
    title: z.string().max(300).optional(),
    caption: z.string().max(2000).optional(),
    folder: z
      .string()
      .max(200)
      .regex(/^[a-zA-Z0-9_\-/]*$/, "Invalid folder path")
      .optional(),
  })
  .strict();

/**
 * GET /api/admin/media/[id] — Get single media item
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

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
  if (!session) return unauthorizedResponse();

  try {
    const { id } = await params;
    const body = await req.json();
    const data = mediaPatchSchema.parse(body);

    const media = await db.media.update({
      where: { id },
      data,
    });

    return NextResponse.json(media);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 422 });
    }
    console.error("[PATCH /api/admin/media/[id]]", err);
    return NextResponse.json({ error: "Failed to update media" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/media/[id] — Delete from R2 + DB
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

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
