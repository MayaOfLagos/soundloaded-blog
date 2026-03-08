import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { id } = await context.params;

  const favorite = await db.favorite.findUnique({ where: { id } });

  if (!favorite) {
    return NextResponse.json({ error: "Favorite not found" }, { status: 404 });
  }

  if (favorite.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.favorite.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
