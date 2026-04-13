import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, unauthorizedResponse } from "@/lib/admin-auth";

/**
 * GET /api/admin/audio-processing/status?musicId=xxx
 * Get the processing status for a music track including job history.
 *
 * GET /api/admin/audio-processing/status
 * Get overview of all processing jobs (with pagination).
 */
export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const musicId = searchParams.get("musicId");

  if (musicId) {
    // Single track status
    const music = await db.music.findUnique({
      where: { id: musicId },
      select: {
        id: true,
        title: true,
        processingStatus: true,
        processingError: true,
        processedR2Key: true,
        processedFormat: true,
        processedBitrate: true,
        processedSize: true,
        loudnessLUFS: true,
        waveformData: true,
        format: true,
        bitrate: true,
        fileSize: true,
      },
    });

    if (!music) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const jobs = await db.audioProcessingJob.findMany({
      where: { musicId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      music: {
        ...music,
        fileSize: music.fileSize.toString(),
        processedSize: music.processedSize?.toString() ?? null,
      },
      jobs,
    });
  }

  // Overview: all jobs with pagination
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const status = searchParams.get("status"); // pending | processing | completed | failed

  const where = status ? { status } : {};

  const [jobs, total, counts] = await Promise.all([
    db.audioProcessingJob.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        music: { select: { id: true, title: true, artist: { select: { name: true } } } },
      },
    }),
    db.audioProcessingJob.count({ where }),
    db.$transaction([
      db.audioProcessingJob.count({ where: { status: "pending" } }),
      db.audioProcessingJob.count({ where: { status: "processing" } }),
      db.audioProcessingJob.count({ where: { status: "completed" } }),
      db.audioProcessingJob.count({ where: { status: "failed" } }),
    ]),
  ]);

  return NextResponse.json({
    jobs,
    total,
    page,
    limit,
    counts: {
      pending: counts[0],
      processing: counts[1],
      completed: counts[2],
      failed: counts[3],
    },
  });
}
