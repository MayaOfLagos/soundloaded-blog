import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role ?? "";
  if (!session || !ADMIN_ROLES.includes(role)) return null;
  return session;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const playlist = await db.playlist.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
    },
  });

  return NextResponse.json({ playlist });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.playlist.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
