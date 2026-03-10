import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

/** POST — mark a story item as viewed */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const viewerId = (session.user as { id: string }).id;
  const { storyItemId } = await request.json();

  if (!storyItemId || typeof storyItemId !== "string") {
    return NextResponse.json({ error: "storyItemId is required" }, { status: 400 });
  }

  try {
    await db.storyView.create({
      data: { storyItemId, viewerId },
    });
  } catch (err) {
    // Already viewed — ignore duplicate
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ viewed: true });
    }
    throw err;
  }

  return NextResponse.json({ viewed: true });
}
