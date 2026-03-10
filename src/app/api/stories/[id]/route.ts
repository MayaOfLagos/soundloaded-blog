import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/** DELETE — delete own story */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const story = await db.story.findUnique({ where: { id }, select: { authorId: true } });
  if (!story) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }
  if (story.authorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.story.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}

/** GET — get story details with view counts */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const story = await db.story.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, image: true } },
      items: {
        orderBy: { order: "asc" },
        include: { _count: { select: { views: true } } },
      },
    },
  });

  if (!story) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }

  return NextResponse.json({ story });
}
