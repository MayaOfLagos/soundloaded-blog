/**
 * Audio processing utilities using FFmpeg.
 *
 * This module handles:
 * - Transcoding to AAC (128kbps standard, 256kbps high quality)
 * - Loudness normalization (EBU R128, -14 LUFS target)
 * - Waveform peak data generation for UI visualization
 *
 * Designed to run in a standalone worker process (not Vercel serverless).
 */

import { spawn, type ChildProcess } from "child_process";
import { createReadStream, createWriteStream, existsSync, mkdirSync } from "fs";
import { unlink, stat, readFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TranscodeOptions {
  inputPath: string;
  outputPath: string;
  format?: "aac" | "mp3";
  bitrate?: number; // kbps, default 128
  sampleRate?: number; // Hz, default 44100
  channels?: number; // default 2 (stereo)
  normalize?: boolean; // apply EBU R128 loudness normalization
}

export interface TranscodeResult {
  outputPath: string;
  format: string;
  bitrate: number;
  sampleRate: number;
  fileSize: number;
  duration: number;
  loudnessLUFS?: number;
}

export interface WaveformOptions {
  inputPath: string;
  peaks?: number; // number of peaks to generate, default 200
}

export interface WaveformResult {
  peaks: number[]; // normalized 0-1 amplitude values
  duration: number;
}

export interface LoudnessInfo {
  integratedLoudness: number; // LUFS
  truePeak: number; // dBTP
  loudnessRange: number; // LU
}

// ---------------------------------------------------------------------------
// Helper: Run an FFmpeg command and capture output
// ---------------------------------------------------------------------------

function ffmpegPath(): string {
  // Prefer FFMPEG_PATH env var, fall back to system ffmpeg
  return process.env.FFMPEG_PATH || "ffmpeg";
}

function ffprobePath(): string {
  return process.env.FFPROBE_PATH || "ffprobe";
}

function runCommand(
  command: string,
  args: string[],
  { captureStderr = false } = {}
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    const proc: ChildProcess = spawn(command, args);
    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (d: Buffer) => {
      stdout += d.toString();
    });
    proc.stderr?.on("data", (d: Buffer) => {
      stderr += d.toString();
    });

    proc.on("close", (code) => {
      resolve({ stdout, stderr, code: code ?? 1 });
    });
    proc.on("error", (err) => {
      reject(new Error(`Failed to spawn ${command}: ${err.message}`));
    });
  });
}

// ---------------------------------------------------------------------------
// Temp file management
// ---------------------------------------------------------------------------

const WORK_DIR = join(tmpdir(), "soundloaded-audio-worker");

export function ensureWorkDir(): string {
  if (!existsSync(WORK_DIR)) {
    mkdirSync(WORK_DIR, { recursive: true });
  }
  return WORK_DIR;
}

export function tempFilePath(ext: string): string {
  ensureWorkDir();
  const id = crypto.randomBytes(8).toString("hex");
  return join(WORK_DIR, `${id}.${ext}`);
}

export async function cleanupFile(filePath: string): Promise<void> {
  try {
    if (existsSync(filePath)) await unlink(filePath);
  } catch {
    // Best effort cleanup
  }
}

// ---------------------------------------------------------------------------
// Probe: Get audio file metadata using ffprobe
// ---------------------------------------------------------------------------

export async function probeAudio(
  inputPath: string
): Promise<{ duration: number; format: string; bitrate: number; sampleRate: number }> {
  const args = ["-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", inputPath];

  const { stdout, code } = await runCommand(ffprobePath(), args);
  if (code !== 0) throw new Error(`ffprobe failed with code ${code}`);

  const data = JSON.parse(stdout);
  const audioStream = data.streams?.find((s: { codec_type: string }) => s.codec_type === "audio");

  return {
    duration: Math.round(parseFloat(data.format?.duration ?? "0")),
    format: audioStream?.codec_name ?? data.format?.format_name ?? "unknown",
    bitrate: Math.round(parseInt(data.format?.bit_rate ?? "0", 10) / 1000),
    sampleRate: parseInt(audioStream?.sample_rate ?? "44100", 10),
  };
}

// ---------------------------------------------------------------------------
// Loudness analysis (EBU R128)
// ---------------------------------------------------------------------------

export async function analyzeLoudness(inputPath: string): Promise<LoudnessInfo> {
  // First pass: measure loudness
  const args = ["-i", inputPath, "-af", "loudnorm=print_format=json", "-f", "null", "-"];

  const { stderr, code } = await runCommand(ffmpegPath(), args);
  if (code !== 0) throw new Error(`Loudness analysis failed with code ${code}`);

  // Parse the loudnorm JSON output from stderr
  const jsonMatch = stderr.match(/\{[\s\S]*?"input_i"[\s\S]*?\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse loudness data from FFmpeg output");
  }

  const loudness = JSON.parse(jsonMatch[0]);

  return {
    integratedLoudness: parseFloat(loudness.input_i),
    truePeak: parseFloat(loudness.input_tp),
    loudnessRange: parseFloat(loudness.input_lra),
  };
}

// ---------------------------------------------------------------------------
// Transcode audio
// ---------------------------------------------------------------------------

export async function transcodeAudio(options: TranscodeOptions): Promise<TranscodeResult> {
  const {
    inputPath,
    outputPath,
    format = "aac",
    bitrate = 128,
    sampleRate = 44100,
    channels = 2,
    normalize = true,
  } = options;

  const args: string[] = ["-i", inputPath, "-y"]; // -y = overwrite output

  // Audio codec settings
  if (format === "aac") {
    args.push("-c:a", "aac", "-b:a", `${bitrate}k`);
  } else {
    args.push("-c:a", "libmp3lame", "-b:a", `${bitrate}k`);
  }

  args.push("-ar", `${sampleRate}`, "-ac", `${channels}`);

  // Apply loudness normalization (EBU R128, targeting -14 LUFS for streaming)
  if (normalize) {
    // Two-pass loudness normalization for best results
    const loudness = await analyzeLoudness(inputPath);

    args.push(
      "-af",
      `loudnorm=I=-14:TP=-1:LRA=11:measured_I=${loudness.integratedLoudness}:measured_TP=${loudness.truePeak}:measured_LRA=${loudness.loudnessRange}:linear=true`
    );
  }

  // Strip video streams (cover art), keep only audio
  args.push("-vn");

  // Output format
  if (format === "aac") {
    args.push("-f", "ipod"); // M4A container for AAC
  }

  args.push(outputPath);

  const { stderr, code } = await runCommand(ffmpegPath(), args);
  if (code !== 0) {
    throw new Error(`Transcode failed (code ${code}): ${stderr.slice(-500)}`);
  }

  // Get output file info
  const outputStat = await stat(outputPath);
  const probe = await probeAudio(outputPath);

  // Get loudness of output
  let loudnessLUFS: number | undefined;
  if (normalize) {
    try {
      const outputLoudness = await analyzeLoudness(outputPath);
      loudnessLUFS = outputLoudness.integratedLoudness;
    } catch {
      // Non-critical
    }
  }

  return {
    outputPath,
    format,
    bitrate,
    sampleRate,
    fileSize: Number(outputStat.size),
    duration: probe.duration,
    loudnessLUFS,
  };
}

// ---------------------------------------------------------------------------
// Waveform generation
// ---------------------------------------------------------------------------

export async function generateWaveform(options: WaveformOptions): Promise<WaveformResult> {
  const { inputPath, peaks: numPeaks = 200 } = options;

  // Use FFmpeg to extract raw PCM samples, then compute peaks
  const rawPath = tempFilePath("raw");

  try {
    // Downmix to mono, low sample rate for fast peak extraction
    const args = [
      "-i",
      inputPath,
      "-ac",
      "1", // mono
      "-ar",
      "8000", // 8kHz is plenty for peak visualization
      "-f",
      "s16le", // signed 16-bit little-endian PCM
      "-acodec",
      "pcm_s16le",
      "-y",
      rawPath,
    ];

    const { code } = await runCommand(ffmpegPath(), args);
    if (code !== 0) throw new Error(`Waveform extraction failed with code ${code}`);

    // Read raw PCM and compute peaks
    const rawData = await readFile(rawPath);
    const samples = new Int16Array(rawData.buffer, rawData.byteOffset, rawData.length / 2);

    if (samples.length === 0) {
      return { peaks: Array(numPeaks).fill(0), duration: 0 };
    }

    const samplesPerPeak = Math.max(1, Math.floor(samples.length / numPeaks));
    const peaks: number[] = [];

    for (let i = 0; i < numPeaks; i++) {
      const start = i * samplesPerPeak;
      const end = Math.min(start + samplesPerPeak, samples.length);
      let maxAbs = 0;

      for (let j = start; j < end; j++) {
        const absVal = Math.abs(samples[j]);
        if (absVal > maxAbs) maxAbs = absVal;
      }

      // Normalize to 0-1 range (16-bit max = 32767)
      peaks.push(Math.round((maxAbs / 32767) * 1000) / 1000);
    }

    // Get duration from probe
    const probe = await probeAudio(inputPath);

    return { peaks, duration: probe.duration };
  } finally {
    await cleanupFile(rawPath);
  }
}

// ---------------------------------------------------------------------------
// Full processing pipeline
// ---------------------------------------------------------------------------

export interface FullProcessingOptions {
  inputPath: string;
  format?: "aac" | "mp3";
  bitrate?: number;
  normalize?: boolean;
  waveformPeaks?: number;
}

export interface FullProcessingResult {
  transcode: TranscodeResult;
  waveform: WaveformResult;
  outputPath: string;
}

export async function processAudioFull(
  options: FullProcessingOptions
): Promise<FullProcessingResult> {
  const {
    inputPath,
    format = "aac",
    bitrate = 128,
    normalize = true,
    waveformPeaks = 200,
  } = options;

  const ext = format === "aac" ? "m4a" : "mp3";
  const outputPath = tempFilePath(ext);

  // Run transcode and waveform generation in parallel
  // (waveform reads from original, transcode writes new file)
  const [transcode, waveform] = await Promise.all([
    transcodeAudio({
      inputPath,
      outputPath,
      format,
      bitrate,
      normalize,
    }),
    generateWaveform({
      inputPath,
      peaks: waveformPeaks,
    }),
  ]);

  return { transcode, waveform, outputPath };
}
