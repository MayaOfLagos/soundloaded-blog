import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { searchParams } = request.nextUrl;
  const postId = searchParams.get("postId");
  const musicId = searchParams.get("musicId");

  if (!postId && !musicId) {
    return NextResponse.json({ error: "postId or musicId is required" }, { status: 400 });
  }

  const favorite = await db.favorite.findFirst({
    where: {
      userId,
      ...(postId ? { postId } : { musicId }),
    },
  });

  return NextResponse.json(
    {
      favorited: !!favorite,
      ...(favorite && { favoriteId: favorite.id }),
    },
    {
      headers: { "Cache-Control": "no-store, max-age=0" },
    }
  );
}
