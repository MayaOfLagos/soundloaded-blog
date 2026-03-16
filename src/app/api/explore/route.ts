import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getExploreLatest,
  getExploreTop,
  getExploreTrending,
  getExploreHot,
} from "@/lib/api/explore";

const VALID_MODES = ["trending", "latest", "hot", "top"] as const;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") ?? "trending";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)), 30);
  const type = searchParams.get("type") ?? undefined;

  if (!VALID_MODES.includes(mode as (typeof VALID_MODES)[number])) {
    return NextResponse.json(
      { error: `Invalid mode. Must be one of: ${VALID_MODES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    // Get current user to exclude their own posts
    const session = await auth();
    const excludeUserId = (session?.user as { id: string } | undefined)?.id;

    const fetchers = {
      trending: getExploreTrending,
      latest: getExploreLatest,
      hot: getExploreHot,
      top: getExploreTop,
    } as const;

    const result = await fetchers[mode as keyof typeof fetchers](page, limit, type, excludeUserId);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/explore]", err);
    return NextResponse.json({ error: "Failed to fetch explore feed" }, { status: 500 });
  }
}
