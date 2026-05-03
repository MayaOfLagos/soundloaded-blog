import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/** Serves the IndexNow key verification file at /api/indexnow */
export async function GET() {
  const settings = await db.siteSettings.findUnique({
    where: { id: "default" },
    select: { indexNowKey: true },
  });

  const key = settings?.indexNowKey;
  if (!key) {
    return new NextResponse("Not configured", { status: 404 });
  }

  return new NextResponse(key, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
