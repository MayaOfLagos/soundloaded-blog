import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";

const playlistPatchSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    isPublic: z.boolean().optional(),
  })
  .strict();

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  const playlist = await db.playlist.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, username: true } },
      _count: { select: { tracks: true } },
      tracks: {
        orderBy: { position: "asc" },
        include: {
          music: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverArt: true,
              artist: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!playlist) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ playlist });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    const { id } = await params;
    const body = await req.json();
    const data = playlistPatchSchema.parse(body);

    const playlist = await db.playlist.update({
      where: { id },
      data,
    });

    return NextResponse.json({ playlist });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 422 });
    }
    console.error("[PATCH /api/admin/playlists/[id]]", err);
    return NextResponse.json({ error: "Failed to update playlist" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  await db.playlist.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
