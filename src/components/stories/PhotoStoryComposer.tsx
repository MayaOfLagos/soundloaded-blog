"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Music, X } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { AudioOverlayPicker } from "./AudioOverlayPicker";

interface AudioData {
  audioUrl: string;
  audioStartTime: number;
  audioEndTime: number;
}

interface PhotoStoryComposerProps {
  onComplete: (data: { file: File; caption: string; audio?: AudioData }) => void;
  onBack: () => void;
  onDirty: () => void;
}

export function PhotoStoryComposer({ onComplete, onBack, onDirty }: PhotoStoryComposerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [showAudioPicker, setShowAudioPicker] = useState(false);
  const [audio, setAudio] = useState<AudioData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (!selected || !selected.type.startsWith("image/")) return;
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      onDirty();
    },
    [onDirty]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const dropped = e.dataTransfer.files[0];
      if (!dropped || !dropped.type.startsWith("image/")) return;
      setFile(dropped);
      setPreviewUrl(URL.createObjectURL(dropped));
      onDirty();
    },
    [onDirty]
  );

  const handleNext = useCallback(() => {
    if (!file) return;
    onComplete({ file, caption, audio: audio ?? undefined });
  }, [file, caption, audio, onComplete]);

  return (
    <div className="flex h-full flex-col">
      {!file ? (
        // Upload zone
        <div className="flex flex-1 flex-col items-center justify-center p-6">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-border hover:border-brand/50 hover:bg-brand/5 flex w-full cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-dashed p-10 transition-colors"
          >
            <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
              <Camera className="text-muted-foreground h-7 w-7" />
            </div>
            <div className="text-center">
              <p className="text-foreground font-medium">Tap to choose a photo</p>
              <p className="text-muted-foreground mt-1 text-sm">or drag and drop</p>
            </div>
          </div>
        </div>
      ) : (
        // Preview + options
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          {/* Image preview */}
          <div className="relative mx-auto aspect-[9/16] w-full max-w-xs overflow-hidden rounded-2xl bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl!} alt="Story preview" className="h-full w-full object-cover" />
            <button
              onClick={() => {
                setFile(null);
                setPreviewUrl(null);
              }}
              className="absolute top-3 right-3 rounded-full bg-black/50 p-1.5 text-white backdrop-blur-sm"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Caption */}
          <textarea
            value={caption}
            onChange={(e) => {
              setCaption(e.target.value);
              onDirty();
            }}
            placeholder="Add a caption..."
            maxLength={280}
            rows={2}
            className="border-border bg-muted/50 text-foreground placeholder:text-muted-foreground w-full resize-none rounded-xl border px-4 py-3 text-sm focus:outline-none"
          />
          <p className="text-muted-foreground text-right text-[11px]">{caption.length}/280</p>

          {/* Audio overlay */}
          <AnimatePresence mode="wait">
            {showAudioPicker ? (
              <AudioOverlayPicker
                key="audio-picker"
                onConfirm={(audioData) => {
                  setAudio(audioData);
                  setShowAudioPicker(false);
                }}
                onCancel={() => setShowAudioPicker(false)}
              />
            ) : (
              <div>
                {audio ? (
                  <div className="bg-muted/50 flex items-center gap-2 rounded-lg px-3 py-2">
                    <Music className="text-brand h-4 w-4" />
                    <span className="text-foreground text-sm font-medium">Music added</span>
                    <button
                      onClick={() => setAudio(null)}
                      className="text-muted-foreground hover:text-foreground ml-auto"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setShowAudioPicker(true)}
                  >
                    <Music className="h-4 w-4" />
                    Add Music
                  </Button>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Footer */}
      <div className="border-border flex gap-2 border-t p-4">
        <Button variant="outline" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button className="bg-brand hover:bg-brand/90 flex-1" onClick={handleNext} disabled={!file}>
          Next
        </Button>
      </div>
    </div>
  );
}
