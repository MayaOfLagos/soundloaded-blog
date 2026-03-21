import { NextRequest, NextResponse } from "next/server";
import { getLatestAlbums } from "@/lib/api/music";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? 10), 30);

  const result = await getLatestAlbums({ limit, cursor });

  return NextResponse.json(result);
}
