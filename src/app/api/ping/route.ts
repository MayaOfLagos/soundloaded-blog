import { db } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * Lightweight keep-alive endpoint.
 * Hit this every 4 minutes from UptimeRobot or cron-job.org to prevent
 * Neon from auto-pausing and Vercel lambdas from going fully cold.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  // Cheapest possible query — just checks the DB connection is alive
  await db.$queryRaw`SELECT 1`;
  return NextResponse.json({ ok: true, latency: Date.now() - start });
}
