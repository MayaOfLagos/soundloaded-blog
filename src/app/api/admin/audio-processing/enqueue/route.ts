import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";

/**
 * POST /api/admin/audio-processing/enqueue
 * Enqueue a processing job for a music track.
 * Body: { musicId: string, jobType?: "full" | "transcode" | "waveform" }
 */
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    const { musicId, jobType = "full" } = await req.json();

    if (!musicId) {
      return NextResponse.json({ error: "musicId is required" }, { status: 400 });
    }

    // Verify music exists
    const music = await db.music.findUnique({
      where: { id: musicId },
      select: { id: true, title: true, processingStatus: true },
    });

    if (!music) {
      return NextResponse.json({ error: "Music track not found" }, { status: 404 });
    }

    // Check for existing pending/processing job
    const existingJob = await db.audioProcessingJob.findFirst({
      where: {
        musicId,
        status: { in: ["pending", "processing"] },
      },
    });

    if (existingJob) {
      return NextResponse.json(
        { error: "A processing job is already in progress", job: existingJob },
        { status: 409 }
      );
    }

    // Create the job
    const job = await db.audioProcessingJob.create({
      data: {
        musicId,
        jobType,
        status: "pending",
        priority: 0,
      },
    });

    // Update music processing status
    await db.music.update({
      where: { id: musicId },
      data: {
        processingStatus: "pending",
        processingError: null,
      },
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/audio-processing/enqueue]", err);
    return NextResponse.json({ error: "Failed to enqueue job" }, { status: 500 });
  }
}
