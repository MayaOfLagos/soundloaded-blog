/**
 * Audio processing worker — standalone Node.js process.
 *
 * Polls the database for pending AudioProcessingJob records, downloads the
 * raw audio from R2, runs FFmpeg (transcode + normalize + waveform), then
 * uploads the processed file back to R2 and updates the Music record.
 *
 * Run with: node --import tsx/esm worker/audio-processor.ts
 * Or in Docker: see docker/Dockerfile.audio-worker
 *
 * Required env vars:
 *   DATABASE_URL, CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID,
 *   R2_SECRET_ACCESS_KEY, R2_MUSIC_BUCKET
 */

import { PrismaClient } from "@prisma/client";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { createWriteStream, createReadStream } from "fs";
import { readFile, stat, unlink } from "fs/promises";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import {
  processAudioFull,
  probeAudio,
  ensureWorkDir,
  tempFilePath,
  cleanupFile,
} from "../src/lib/audio-processing";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = parseInt(process.env.WORKER_POLL_INTERVAL ?? "5000", 10);
const WORKER_ID = `worker-${process.pid}-${Date.now().toString(36)}`;
const TARGET_FORMAT = (process.env.AUDIO_TARGET_FORMAT ?? "aac") as "aac" | "mp3";
const TARGET_BITRATE = parseInt(process.env.AUDIO_TARGET_BITRATE ?? "128", 10);
const WAVEFORM_PEAKS = parseInt(process.env.WAVEFORM_PEAKS ?? "200", 10);

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

const db = new PrismaClient();

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const MUSIC_BUCKET = process.env.R2_MUSIC_BUCKET ?? "soundloadedblog-music";

// ---------------------------------------------------------------------------
// R2 operations
// ---------------------------------------------------------------------------

async function downloadFromR2(key: string, destPath: string): Promise<void> {
  const cmd = new GetObjectCommand({ Bucket: MUSIC_BUCKET, Key: key });
  const response = await r2.send(cmd);

  if (!response.Body) throw new Error(`Empty response for key: ${key}`);

  const body = response.Body as Readable;
  const dest = createWriteStream(destPath);
  await pipeline(body, dest);
}

async function uploadToR2(localPath: string, r2Key: string, contentType: string): Promise<number> {
  const fileBuffer = await readFile(localPath);
  const fileStat = await stat(localPath);

  await r2.send(
    new PutObjectCommand({
      Bucket: MUSIC_BUCKET,
      Key: r2Key,
      Body: fileBuffer,
      ContentType: contentType,
    })
  );

  return Number(fileStat.size);
}

// ---------------------------------------------------------------------------
// Job processing
// ---------------------------------------------------------------------------

async function claimJob(): Promise<{
  id: string;
  musicId: string;
  jobType: string;
  attempts: number;
  maxAttempts: number;
  music: { id: string; r2Key: string; filename: string; format: string };
} | null> {
  // Atomically claim one pending job using optimistic update
  const pendingJobs = await db.audioProcessingJob.findMany({
    where: {
      status: "pending",
      attempts: { lt: 3 }, // don't exceed max attempts
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    take: 1,
    include: {
      music: {
        select: { id: true, r2Key: true, filename: true, format: true },
      },
    },
  });

  if (pendingJobs.length === 0) return null;

  const job = pendingJobs[0];

  // Try to claim it — only succeed if it's still pending
  const claimed = await db.audioProcessingJob.updateMany({
    where: { id: job.id, status: "pending" },
    data: {
      status: "processing",
      attempts: { increment: 1 },
      startedAt: new Date(),
    },
  });

  if (claimed.count === 0) return null; // Another worker got it

  return job;
}

async function processJob(job: Awaited<ReturnType<typeof claimJob>>): Promise<void> {
  if (!job) return;

  const { id: jobId, music } = job;
  const inputPath = tempFilePath(music.format || "mp3");
  let outputPath: string | undefined;

  try {
    console.log(`[${WORKER_ID}] Processing job ${jobId} for music ${music.id} (${music.filename})`);

    // 1. Download raw file from R2
    console.log(`  → Downloading ${music.r2Key}...`);
    await downloadFromR2(music.r2Key, inputPath);

    // 2. Probe the input file
    const probe = await probeAudio(inputPath);
    console.log(`  → Input: ${probe.format}, ${probe.bitrate}kbps, ${probe.duration}s`);

    // 3. Process: transcode + normalize + waveform
    console.log(`  → Processing: ${TARGET_FORMAT} @ ${TARGET_BITRATE}kbps, normalize=true...`);
    const result = await processAudioFull({
      inputPath,
      format: TARGET_FORMAT,
      bitrate: TARGET_BITRATE,
      normalize: true,
      waveformPeaks: WAVEFORM_PEAKS,
    });
    outputPath = result.outputPath;

    // 4. Upload processed file to R2
    const ext = TARGET_FORMAT === "aac" ? "m4a" : "mp3";
    const processedKey = music.r2Key.replace(/\.[^.]+$/, `.processed.${ext}`);
    const contentType = TARGET_FORMAT === "aac" ? "audio/mp4" : "audio/mpeg";

    console.log(`  → Uploading processed file to ${processedKey}...`);
    const uploadedSize = await uploadToR2(outputPath, processedKey, contentType);

    // 5. Update Music record with processed data
    await db.music.update({
      where: { id: music.id },
      data: {
        processedR2Key: processedKey,
        processedFormat: TARGET_FORMAT,
        processedBitrate: TARGET_BITRATE,
        processedSize: BigInt(uploadedSize),
        loudnessLUFS: result.transcode.loudnessLUFS ?? null,
        waveformData: result.waveform.peaks,
        processingStatus: "completed",
        processingError: null,
        // Update duration if we got a better reading from FFmpeg
        duration: result.transcode.duration || undefined,
      },
    });

    // 6. Mark job as completed
    await db.audioProcessingJob.update({
      where: { id: jobId },
      data: {
        status: "completed",
        completedAt: new Date(),
        error: null,
        result: {
          format: TARGET_FORMAT,
          bitrate: TARGET_BITRATE,
          fileSize: uploadedSize,
          duration: result.transcode.duration,
          loudnessLUFS: result.transcode.loudnessLUFS,
          waveformPeaks: result.waveform.peaks.length,
          inputFormat: probe.format,
          inputBitrate: probe.bitrate,
          compressionRatio:
            probe.bitrate > 0 ? Math.round((TARGET_BITRATE / probe.bitrate) * 100) : null,
        },
      },
    });

    console.log(
      `  ✓ Done! ${probe.format} ${probe.bitrate}kbps → ${TARGET_FORMAT} ${TARGET_BITRATE}kbps ` +
        `(${Math.round(uploadedSize / 1024)}KB, LUFS: ${result.transcode.loudnessLUFS ?? "N/A"})`
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`  ✗ Job ${jobId} failed: ${message}`);

    // Mark job as failed
    await db.audioProcessingJob.update({
      where: { id: jobId },
      data: {
        status: job.attempts + 1 >= job.maxAttempts ? "failed" : "pending",
        error: message.slice(0, 2000),
        completedAt: new Date(),
      },
    });

    // Update music processing status if max attempts exceeded
    if (job.attempts + 1 >= job.maxAttempts) {
      await db.music.update({
        where: { id: music.id },
        data: {
          processingStatus: "failed",
          processingError: message.slice(0, 500),
        },
      });
    }
  } finally {
    // Cleanup temp files
    await cleanupFile(inputPath);
    if (outputPath) await cleanupFile(outputPath);
  }
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

let running = true;

async function pollLoop(): Promise<void> {
  console.log(`[${WORKER_ID}] Audio processing worker started`);
  console.log(
    `  Config: format=${TARGET_FORMAT}, bitrate=${TARGET_BITRATE}kbps, ` +
      `peaks=${WAVEFORM_PEAKS}, poll=${POLL_INTERVAL_MS}ms`
  );
  ensureWorkDir();

  while (running) {
    try {
      const job = await claimJob();

      if (job) {
        await processJob(job);
        // Immediately check for more jobs
        continue;
      }
    } catch (err) {
      console.error(`[${WORKER_ID}] Poll error:`, err);
    }

    // No job found — wait before polling again
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  console.log(`[${WORKER_ID}] Worker shutting down`);
  await db.$disconnect();
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log(`[${WORKER_ID}] Received SIGTERM, shutting down gracefully...`);
  running = false;
});
process.on("SIGINT", () => {
  console.log(`[${WORKER_ID}] Received SIGINT, shutting down gracefully...`);
  running = false;
});

// Start
pollLoop().catch((err) => {
  console.error("Fatal worker error:", err);
  process.exit(1);
});
