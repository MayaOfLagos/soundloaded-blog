import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const clickSchema = z.object({
  platform: z.string().optional().nullable(),
  sessionId: z.string().optional().nullable(),
  variant: z.enum(["A", "B"]).optional().nullable(),
});

function detectDevice(ua: string): string {
  if (/mobile|android|iphone|ipad|ipod/i.test(ua)) return "mobile";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  return "desktop";
}

function extractBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\//i.test(ua)) return "Opera";
  if (/chrome/i.test(ua)) return "Chrome";
  if (/firefox/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua)) return "Safari";
  return "Other";
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const fanlink = await db.fanlink.findUnique({
    where: { slug },
    select: { id: true, status: true },
  });

  if (!fanlink || fanlink.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    // empty body ok
  }

  const parsed = clickSchema.safeParse(body);
  const { platform, sessionId, variant } = parsed.success
    ? parsed.data
    : { platform: null, sessionId: null, variant: null };

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const ua = req.headers.get("user-agent") ?? "";
  const referrer = req.headers.get("referer") ?? undefined;

  await db.fanlinkClick.create({
    data: {
      fanlinkId: fanlink.id,
      platform: platform ?? null,
      variant: variant ?? null,
      ip,
      device: detectDevice(ua),
      browser: extractBrowser(ua),
      referrer,
      sessionId,
    },
  });

  await db.fanlink.update({
    where: { id: fanlink.id },
    data: { totalClicks: { increment: 1 } },
  });

  return NextResponse.json({ success: true });
}
