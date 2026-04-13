export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AudioProcessingDashboard } from "./_components/AudioProcessingDashboard";

export const metadata: Metadata = { title: "Audio Processing — Soundloaded Admin" };

async function getProcessingStats() {
  const [pending, processing, completed, failed, totalTracks, unprocessed] = await Promise.all([
    db.audioProcessingJob.count({ where: { status: "pending" } }),
    db.audioProcessingJob.count({ where: { status: "processing" } }),
    db.audioProcessingJob.count({ where: { status: "completed" } }),
    db.audioProcessingJob.count({ where: { status: "failed" } }),
    db.music.count(),
    db.music.count({ where: { processingStatus: { not: "completed" } } }),
  ]);

  return { pending, processing, completed, failed, totalTracks, unprocessed };
}

async function getRecentJobs() {
  const jobs = await db.audioProcessingJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      music: {
        select: {
          id: true,
          title: true,
          format: true,
          fileSize: true,
          artist: { select: { name: true } },
        },
      },
    },
  });

  return jobs.map((j) => ({
    ...j,
    result: j.result as Record<string, unknown> | null,
    startedAt: j.startedAt?.toISOString() ?? null,
    completedAt: j.completedAt?.toISOString() ?? null,
    createdAt: j.createdAt.toISOString(),
    updatedAt: j.updatedAt.toISOString(),
    music: {
      ...j.music,
      fileSize: j.music.fileSize.toString(),
    },
  }));
}

export default async function AudioProcessingPage() {
  const [stats, recentJobs] = await Promise.all([getProcessingStats(), getRecentJobs()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audio Processing</h1>
        <p className="text-muted-foreground">
          Monitor FFmpeg transcoding, normalization, and waveform generation jobs.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Total Tracks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTracks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Unprocessed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.unprocessed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Job Table */}
      <AudioProcessingDashboard initialJobs={recentJobs} />
    </div>
  );
}
