import { NextRequest, NextResponse } from "next/server";
import { refreshActiveUserAffinitySnapshots } from "@/lib/recommendation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const batchSize = readPositiveInt(request.nextUrl.searchParams.get("batchSize"), 50);
  const windowDays = readPositiveInt(request.nextUrl.searchParams.get("windowDays"), 30);
  const eventLookbackDays = readPositiveInt(
    request.nextUrl.searchParams.get("eventLookbackDays"),
    windowDays
  );

  const result = await refreshActiveUserAffinitySnapshots({
    batchSize,
    windowDays,
    eventLookbackDays,
  });

  return NextResponse.json({
    ok: true,
    job: "recommendation-affinity-refresh",
    ...result,
  });
}

function readPositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
