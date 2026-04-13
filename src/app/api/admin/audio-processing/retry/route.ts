import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";

/**
 * POST /api/admin/audio-processing/retry
 * Retry a failed processing job or reprocess a track.
 * Body: { musicId: string } or { jobId: string }
 */
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    const { musicId, jobId } = await req.json();

    if (jobId) {
      // Retry a specific failed job
      const job = await db.audioProcessingJob.findUnique({ where: { id: jobId } });
      if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
      if (job.status !== "failed") {
        return NextResponse.json({ error: "Only failed jobs can be retried" }, { status: 400 });
      }

      await db.audioProcessingJob.update({
        where: { id: jobId },
        data: {
          status: "pending",
          error: null,
          attempts: 0,
          startedAt: null,
          completedAt: null,
        },
      });

      await db.music.update({
        where: { id: job.musicId },
        data: { processingStatus: "pending", processingError: null },
      });

      return NextResponse.json({ message: "Job requeued", jobId });
    }

    if (musicId) {
      // Cancel any existing jobs and create a new one
      await db.audioProcessingJob.updateMany({
        where: { musicId, status: { in: ["pending", "processing"] } },
        data: { status: "failed", error: "Cancelled for reprocessing" },
      });

      const newJob = await db.audioProcessingJob.create({
        data: {
          musicId,
          jobType: "full",
          status: "pending",
          priority: 1, // higher priority for manual retries
        },
      });

      await db.music.update({
        where: { id: musicId },
        data: { processingStatus: "pending", processingError: null },
      });

      return NextResponse.json({ message: "Reprocessing enqueued", job: newJob }, { status: 201 });
    }

    return NextResponse.json({ error: "musicId or jobId is required" }, { status: 400 });
  } catch (err) {
    console.error("[POST /api/admin/audio-processing/retry]", err);
    return NextResponse.json({ error: "Failed to retry" }, { status: 500 });
  }
}
