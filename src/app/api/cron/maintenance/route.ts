import { NextRequest, NextResponse } from "next/server";
import { runMaintenanceJobs } from "@/lib/maintenance-jobs";

export const dynamic = "force-dynamic";

async function handleMaintenance(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.get("dryRun") === "true";
  const result = await runMaintenanceJobs({ dryRun });

  return NextResponse.json({
    ok: true,
    job: "platform-maintenance",
    ...result,
  });
}

export async function GET(request: NextRequest) {
  return handleMaintenance(request);
}

export async function POST(request: NextRequest) {
  return handleMaintenance(request);
}
