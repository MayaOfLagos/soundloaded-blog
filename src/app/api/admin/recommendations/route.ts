import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";
import {
  getRecommendationOpsSnapshot,
  refreshActiveUserAffinitySnapshots,
} from "@/lib/recommendation";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const snapshot = await getRecommendationOpsSnapshot();
  return NextResponse.json(snapshot);
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const body = await request.json().catch(() => ({}));
  const batchSize = readPositiveInt(body.batchSize, 25);
  const windowDays = readPositiveInt(body.windowDays, 30);
  const eventLookbackDays = readPositiveInt(body.eventLookbackDays, windowDays);

  const result = await refreshActiveUserAffinitySnapshots({
    batchSize,
    windowDays,
    eventLookbackDays,
  });

  return NextResponse.json({ ok: true, ...result });
}

function readPositiveInt(value: unknown, fallback: number) {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
