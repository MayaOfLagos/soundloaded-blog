"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { Music, Play, Pause, X, Upload } from "lucide-react";
import { Howl } from "howler";
import { Button } from "@/components/ui/button";
import { useStoryUpload } from "@/hooks/useStoryUpload";

interface AudioOverlayPickerProps {
  onConfirm: (audio: { audioUrl: string; audioStartTime: number; audioEndTime: number }) => void;
  onCancel: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioOverlayPicker({ onConfirm, onCancel }: AudioOverlayPickerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveformBars, setWaveformBars] = useState<number[]>([]);

  const howlRef = useRef<Howl | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const upload = useStoryUpload();

  // Cleanup howl on unmount
  useEffect(() => {
    return () => {
      howlRef.current?.unload();
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;

      // Validate audio type
      if (!selectedFile.type.startsWith("audio/")) return;

      setFile(selectedFile);

      // Decode to get duration and waveform
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const duration = audioBuffer.duration;
        setAudioDuration(duration);

        // Auto-set segment
        const segmentEnd = Math.min(duration, 30);
        setStartTime(0);
        setEndTime(segmentEnd);

        // Generate simplified waveform (40 bars)
        const channelData = audioBuffer.getChannelData(0);
        const barCount = 40;
        const samplesPerBar = Math.floor(channelData.length / barCount);
        const bars: number[] = [];
        for (let i = 0; i < barCount; i++) {
          let sum = 0;
          for (let j = 0; j < samplesPerBar; j++) {
            sum += Math.abs(channelData[i * samplesPerBar + j]);
          }
          bars.push(sum / samplesPerBar);
        }
        // Normalize
        const max = Math.max(...bars, 0.001);
        setWaveformBars(bars.map((b) => b / max));

        await audioContext.close();
      } catch {
        // Fallback: no waveform, estimate duration from file size
        setAudioDuration(0);
        setWaveformBars([]);
      }

      // Create Howl for preview
      const objectUrl = URL.createObjectURL(selectedFile);
      howlRef.current?.unload();
      const howl = new Howl({
        src: [objectUrl],
        format: [selectedFile.name.split(".").pop() ?? "mp3"],
        onend: () => setIsPlaying(false),
        onload: () => {
          if (!audioDuration) {
            const dur = howl.duration();
            setAudioDuration(dur);
            setEndTime(Math.min(dur, 30));
          }
        },
      });
      howlRef.current = howl;
    },
    [audioDuration]
  );

  const togglePlayback = useCallback(() => {
    const howl = howlRef.current;
    if (!howl) return;

    if (isPlaying) {
      howl.pause();
      if (playTimerRef.current) clearInterval(playTimerRef.current);
      setIsPlaying(false);
    } else {
      howl.seek(startTime);
      howl.play();
      setIsPlaying(true);

      // Stop at endTime
      playTimerRef.current = setInterval(() => {
        const currentTime = howl.seek() as number;
        if (currentTime >= endTime) {
          howl.pause();
          setIsPlaying(false);
          if (playTimerRef.current) clearInterval(playTimerRef.current);
        }
      }, 100);
    }
  }, [isPlaying, startTime, endTime]);

  const handleStartChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setStartTime(val);
      if (val + 30 < audioDuration) {
        setEndTime(val + 30);
      } else {
        setEndTime(audioDuration);
      }
    },
    [audioDuration]
  );

  const handleConfirm = useCallback(async () => {
    if (!file) return;

    const result = await upload.mutateAsync({ file, mediaType: "audio" });
    onConfirm({
      audioUrl: result.url,
      audioStartTime: startTime,
      audioEndTime: endTime,
    });
  }, [file, upload, startTime, endTime, onConfirm]);

  const segmentDuration = Math.min(endTime - startTime, 30);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="text-brand h-4 w-4" />
          <span className="text-sm font-semibold">Add Music</span>
        </div>
        <button
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {!file ? (
        // File select
        <button
          onClick={() => fileInputRef.current?.click()}
          className="border-border hover:border-brand/50 hover:bg-brand/5 flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors"
        >
          <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
            <Upload className="text-muted-foreground h-5 w-5" />
          </div>
          <div className="text-center">
            <p className="text-foreground text-sm font-medium">Choose audio file</p>
            <p className="text-muted-foreground mt-1 text-xs">MP3, WAV, OGG, M4A — max 30s clip</p>
          </div>
        </button>
      ) : (
        // Audio editor
        <div className="space-y-4">
          {/* File name */}
          <div className="bg-muted/50 flex items-center gap-3 rounded-lg px-3 py-2">
            <Music className="text-brand h-4 w-4 flex-shrink-0" />
            <span className="text-foreground truncate text-sm font-medium">{file.name}</span>
            <button
              onClick={() => {
                setFile(null);
                howlRef.current?.unload();
                setWaveformBars([]);
                setIsPlaying(false);
              }}
              className="text-muted-foreground hover:text-foreground ml-auto flex-shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Waveform */}
          {waveformBars.length > 0 && (
            <div className="flex h-16 items-end gap-[2px] rounded-lg px-1">
              {waveformBars.map((bar, i) => {
                const barPosition = i / waveformBars.length;
                const inRange =
                  audioDuration > 0 &&
                  barPosition >= startTime / audioDuration &&
                  barPosition <= endTime / audioDuration;
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm transition-colors ${
                      inRange ? "bg-brand" : "bg-muted-foreground/30"
                    }`}
                    style={{ height: `${Math.max(8, bar * 100)}%` }}
                  />
                );
              })}
            </div>
          )}

          {/* Range slider */}
          {audioDuration > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {formatTime(startTime)} – {formatTime(endTime)}
                </span>
                <span className="text-brand font-medium">{formatTime(segmentDuration)}s clip</span>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(0, audioDuration - Math.min(audioDuration, 30))}
                step={0.1}
                value={startTime}
                onChange={handleStartChange}
                className="w-full accent-[var(--brand)]"
              />
              <p className="text-muted-foreground text-[11px]">
                Drag to select the part you want (max 30 seconds)
              </p>
            </div>
          )}

          {/* Play/Pause preview */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={togglePlayback} className="gap-2">
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {isPlaying ? "Pause" : "Preview"}
            </Button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Confirm / Cancel */}
      {file && (
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="bg-brand hover:bg-brand/90 flex-1"
            onClick={handleConfirm}
            disabled={upload.isPending}
          >
            {upload.isPending ? `Uploading ${upload.progress}%` : "Add Music"}
          </Button>
        </div>
      )}
    </motion.div>
  );
}
