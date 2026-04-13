"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw, RotateCcw, Play } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

interface ProcessingJob {
  id: string;
  musicId: string;
  jobType: string;
  status: string;
  priority: number;
  attempts: number;
  maxAttempts: number;
  error: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: any;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  music: {
    id: string;
    title: string;
    format: string;
    fileSize: string;
    artist: { name: string };
  };
}

interface AudioProcessingDashboardProps {
  initialJobs: ProcessingJob[];
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[status] ?? ""}`}
    >
      {status}
    </span>
  );
}

function formatBytes(bytes: string | number): string {
  const b = typeof bytes === "string" ? parseInt(bytes, 10) : bytes;
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function AudioProcessingDashboard({ initialJobs }: AudioProcessingDashboardProps) {
  const [jobs, setJobs] = useState(initialJobs);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function refreshJobs() {
    setRefreshing(true);
    try {
      const { data } = await axios.get("/api/admin/audio-processing/status");
      setJobs(data.jobs);
    } catch {
      toast.error("Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  }

  async function retryJob(jobId: string) {
    setActionLoading(jobId);
    try {
      await axios.post("/api/admin/audio-processing/retry", { jobId });
      toast.success("Job requeued for processing");
      await refreshJobs();
    } catch {
      toast.error("Failed to retry job");
    } finally {
      setActionLoading(null);
    }
  }

  async function reprocessTrack(musicId: string) {
    setActionLoading(musicId);
    try {
      await axios.post("/api/admin/audio-processing/retry", { musicId });
      toast.success("Track enqueued for reprocessing");
      await refreshJobs();
    } catch {
      toast.error("Failed to enqueue reprocessing");
    } finally {
      setActionLoading(null);
    }
  }

  async function enqueueAll() {
    setActionLoading("bulk");
    try {
      const { data } = await axios.post("/api/admin/audio-processing/enqueue-all");
      toast.success(`Enqueued ${data.count} tracks for processing`);
      await refreshJobs();
    } catch {
      toast.error("Failed to enqueue batch");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={refreshJobs} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={enqueueAll}
          disabled={actionLoading === "bulk"}
        >
          <Play className="mr-2 h-4 w-4" />
          Process All Unprocessed
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Track</TableHead>
              <TableHead>Artist</TableHead>
              <TableHead>Original</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Attempts</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground py-8 text-center">
                  No processing jobs found
                </TableCell>
              </TableRow>
            )}
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="max-w-[200px] truncate font-medium">
                  {job.music.title}
                </TableCell>
                <TableCell>{job.music.artist.name}</TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {job.music.format.toUpperCase()} · {formatBytes(job.music.fileSize)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={job.status} />
                  {job.error && (
                    <p
                      className="mt-1 max-w-[200px] truncate text-xs text-red-500"
                      title={job.error}
                    >
                      {job.error}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {job.attempts}/{job.maxAttempts}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {timeAgo(job.createdAt)}
                </TableCell>
                <TableCell>
                  {job.status === "failed" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => retryJob(job.id)}
                      disabled={actionLoading === job.id}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                  {job.status === "completed" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => reprocessTrack(job.musicId)}
                      disabled={actionLoading === job.musicId}
                      title="Reprocess"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
