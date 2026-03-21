import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// ── GET — list blocked/muted users, or check block status ─────────────
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(req.url);
  const checkUserId = searchParams.get("checkUserId");

  // Check block status for a specific user
  if (checkUserId) {
    const block = await db.userBlock.findUnique({
      where: { blockerId_blockedId: { blockerId: userId, blockedId: checkUserId } },
    });

    return NextResponse.json({
      blocked: block?.type === "BLOCK",
      muted: block?.type === "MUTE",
      type: block?.type ?? null,
    });
  }

  // List all blocked/muted users
  const type = searchParams.get("type") as "BLOCK" | "MUTE" | null;
  const blocks = await db.userBlock.findMany({
    where: {
      blockerId: userId,
      ...(type ? { type } : {}),
    },
    include: {
      blocked: { select: { id: true, name: true, image: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    blocks: blocks.map((b) => ({
      id: b.id,
      type: b.type,
      createdAt: b.createdAt,
      user: b.blocked,
    })),
  });
}

// ── POST — block or mute a user ──────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { blockedId, type = "BLOCK" } = await req.json();

  if (!blockedId || typeof blockedId !== "string") {
    return NextResponse.json({ error: "blockedId is required" }, { status: 400 });
  }

  if (blockedId === userId) {
    return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });
  }

  if (!["BLOCK", "MUTE"].includes(type)) {
    return NextResponse.json({ error: "type must be BLOCK or MUTE" }, { status: 400 });
  }

  try {
    // Upsert — if they're muted and you block, upgrade to block
    const block = await db.userBlock.upsert({
      where: { blockerId_blockedId: { blockerId: userId, blockedId } },
      create: { blockerId: userId, blockedId, type },
      update: { type },
    });

    // On BLOCK, also remove mutual follows
    if (type === "BLOCK") {
      await db.follow.deleteMany({
        where: {
          OR: [
            { followerId: userId, followingId: blockedId },
            { followerId: blockedId, followingId: userId },
          ],
        },
      });
    }

    return NextResponse.json({ block: { id: block.id, type: block.type } }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/user/blocks]", error);
    return NextResponse.json({ error: "Failed to block user" }, { status: 500 });
  }
}

// ── DELETE — unblock/unmute a user ───────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(req.url);
  const blockedId = searchParams.get("blockedId");

  if (!blockedId) {
    return NextResponse.json({ error: "blockedId is required" }, { status: 400 });
  }

  try {
    await db.userBlock.delete({
      where: { blockerId_blockedId: { blockerId: userId, blockedId } },
    });

    return NextResponse.json({ success: true });
  } catch {
    // Record may not exist — that's fine
    return NextResponse.json({ success: true });
  }
}
