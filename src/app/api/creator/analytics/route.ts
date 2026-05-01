export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCreatorAnalyticsReport, normalizeCreatorAnalyticsDays } from "@/lib/creator-analytics";

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const days = normalizeCreatorAnalyticsDays(searchParams.get("days"));

  const [artist, label] = await Promise.all([
    db.artist.findUnique({
      where: { ownerId: userId },
      select: { id: true, name: true },
    }),
    db.label.findUnique({
      where: { ownerId: userId },
      select: { id: true, name: true },
    }),
  ]);

  const scope = artist
    ? ({ type: "artist", id: artist.id, name: artist.name } as const)
    : label
      ? ({ type: "label", id: label.id, name: label.name } as const)
      : null;

  if (!scope) {
    return NextResponse.json({ error: "Creator profile required" }, { status: 403 });
  }

  try {
    const report = await getCreatorAnalyticsReport({ scope, days });
    return NextResponse.json(report);
  } catch (error) {
    console.error("[GET /api/creator/analytics]", error);
    return NextResponse.json({ error: "Failed to load creator analytics" }, { status: 500 });
  }
}
