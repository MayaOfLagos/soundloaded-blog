"use client";

import { useState, useCallback } from "react";
import { Music, X } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { GRADIENT_PRESETS } from "@/lib/validations/stories";
import { AudioOverlayPicker } from "./AudioOverlayPicker";

interface AudioData {
  audioUrl: string;
  audioStartTime: number;
  audioEndTime: number;
}

interface TextStoryComposerProps {
  onComplete: (data: {
    textContent: string;
    backgroundColor: string;
    caption: string;
    audio?: AudioData;
  }) => void;
  onBack: () => void;
  onDirty: () => void;
}

function getTextSize(text: string): string {
  if (text.length < 30) return "text-3xl";
  if (text.length < 80) return "text-2xl";
  if (text.length < 150) return "text-xl";
  if (text.length < 300) return "text-lg";
  return "text-base";
}

export function TextStoryComposer({ onComplete, onBack, onDirty }: TextStoryComposerProps) {
  const [textContent, setTextContent] = useState("");
  const [selectedGradient, setSelectedGradient] = useState<string>(GRADIENT_PRESETS[0]);
  const [caption, setCaption] = useState("");
  const [showAudioPicker, setShowAudioPicker] = useState(false);
  const [audio, setAudio] = useState<AudioData | null>(null);

  const handleNext = useCallback(() => {
    if (!textContent.trim()) return;
    onComplete({
      textContent: textContent.trim(),
      backgroundColor: selectedGradient,
      caption,
      audio: audio ?? undefined,
    });
  }, [textContent, selectedGradient, caption, audio, onComplete]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {/* Live preview */}
        <div
          className="relative mx-auto flex aspect-[9/16] w-full max-w-xs items-center justify-center overflow-hidden rounded-2xl p-6"
          style={{ background: selectedGradient }}
        >
          {textContent ? (
            <p
              className={`text-center font-bold text-white drop-shadow-lg ${getTextSize(textContent)}`}
            >
              {textContent}
            </p>
          ) : (
            <p className="text-center text-lg font-medium text-white/50">Type your story text...</p>
          )}
        </div>

        {/* Text input */}
        <textarea
          value={textContent}
          onChange={(e) => {
            setTextContent(e.target.value);
            onDirty();
          }}
          placeholder="What's on your mind?"
          maxLength={500}
          rows={3}
          className="border-border bg-muted/50 text-foreground placeholder:text-muted-foreground w-full resize-none rounded-xl border px-4 py-3 text-sm focus:outline-none"
        />
        <p className="text-muted-foreground text-right text-[11px]">{textContent.length}/500</p>

        {/* Gradient selector */}
        <div>
          <p className="text-muted-foreground mb-2 text-xs font-medium">Background</p>
          <div className="scrollbar-hide flex gap-2.5 overflow-x-auto">
            {GRADIENT_PRESETS.map((gradient) => (
              <button
                key={gradient}
                onClick={() => {
                  setSelectedGradient(gradient);
                  onDirty();
                }}
                className={`h-10 w-10 flex-shrink-0 rounded-full transition-all ${
                  selectedGradient === gradient
                    ? "ring-brand ring-offset-background scale-110 ring-2 ring-offset-2"
                    : "hover:scale-105"
                }`}
                style={{ background: gradient }}
              />
            ))}
          </div>
        </div>

        {/* Caption */}
        <textarea
          value={caption}
          onChange={(e) => {
            setCaption(e.target.value);
            onDirty();
          }}
          placeholder="Add a caption (optional)..."
          maxLength={280}
          rows={2}
          className="border-border bg-muted/50 text-foreground placeholder:text-muted-foreground w-full resize-none rounded-xl border px-4 py-3 text-sm focus:outline-none"
        />

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

      {/* Footer */}
      <div className="border-border flex gap-2 border-t p-4">
        <Button variant="outline" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button
          className="bg-brand hover:bg-brand/90 flex-1"
          onClick={handleNext}
          disabled={!textContent.trim()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
