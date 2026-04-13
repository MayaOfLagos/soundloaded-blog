import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";

/**
 * POST /api/admin/audio-processing/enqueue-all
 * Enqueue processing jobs for all unprocessed music tracks.
 * Skips tracks that already have pending/processing jobs.
 */
export async function POST() {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    // Find all tracks that haven't been successfully processed
    const unprocessedTracks = await db.music.findMany({
      where: {
        processingStatus: { not: "completed" },
      },
      select: { id: true },
    });

    if (unprocessedTracks.length === 0) {
      return NextResponse.json({ message: "All tracks already processed", count: 0 });
    }

    // Find tracks that already have active jobs
    const activeJobMusicIds = await db.audioProcessingJob.findMany({
      where: {
        status: { in: ["pending", "processing"] },
        musicId: { in: unprocessedTracks.map((t) => t.id) },
      },
      select: { musicId: true },
    });

    const activeSet = new Set(activeJobMusicIds.map((j) => j.musicId));

    // Create jobs for tracks without active jobs
    const toEnqueue = unprocessedTracks.filter((t) => !activeSet.has(t.id));

    if (toEnqueue.length === 0) {
      return NextResponse.json({
        message: "All unprocessed tracks already have pending jobs",
        count: 0,
      });
    }

    // Batch create jobs
    const result = await db.audioProcessingJob.createMany({
      data: toEnqueue.map((t) => ({
        musicId: t.id,
        jobType: "full",
        status: "pending" as const,
        priority: 0,
        updatedAt: new Date(),
      })),
    });

    // Update music processing status
    await db.music.updateMany({
      where: {
        id: { in: toEnqueue.map((t) => t.id) },
      },
      data: {
        processingStatus: "pending",
        processingError: null,
      },
    });

    return NextResponse.json({
      message: `Enqueued ${result.count} tracks for processing`,
      count: result.count,
    });
  } catch (err) {
    console.error("[POST /api/admin/audio-processing/enqueue-all]", err);
    return NextResponse.json({ error: "Failed to enqueue batch" }, { status: 500 });
  }
}
