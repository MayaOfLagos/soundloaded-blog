import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";

const schema = z.object({
  accessModel: z.enum(["free", "subscription", "purchase", "both"]),
  streamAccess: z.enum(["free", "subscription"]),
  creatorPrice: z.number().int().min(0).nullable().optional(),
  price: z.number().int().min(0).nullable().optional(),
  isExclusive: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  const music = await db.music.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      accessModel: true,
      streamAccess: true,
      creatorPrice: true,
      price: true,
      isExclusive: true,
      downloadCount: true,
      artist: { select: { id: true, name: true } },
    },
  });

  if (!music) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(music);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { id } = await params;

  try {
    const body = schema.parse(await req.json());
    const music = await db.music.update({
      where: { id },
      data: {
        accessModel: body.accessModel,
        streamAccess: body.streamAccess,
        creatorPrice: body.creatorPrice ?? null,
        price: body.price ?? null,
        isExclusive: body.isExclusive ?? body.accessModel !== "free",
      },
    });
    return NextResponse.json({ success: true, id: music.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 422 });
    }
    console.error("[PATCH /api/admin/music/:id/monetization]", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
