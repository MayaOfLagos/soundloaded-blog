import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildPublicSettings } from "@/lib/settings";

export async function GET() {
  try {
    const raw = await db.siteSettings.findUnique({ where: { id: "default" } });
    const settings = buildPublicSettings(raw as unknown as Record<string, unknown>);

    return NextResponse.json(settings, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    console.error("[GET /api/settings]", err);
    // Return defaults even on error so frontend never breaks
    const defaults = buildPublicSettings(null);
    return NextResponse.json(defaults);
  }
}
