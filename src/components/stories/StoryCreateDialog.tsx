"use client";

import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { StoryTypeSelector, type StoryType } from "./StoryTypeSelector";
import { PhotoStoryComposer } from "./PhotoStoryComposer";
import { VideoStoryComposer } from "./VideoStoryComposer";
import { TextStoryComposer } from "./TextStoryComposer";
import { StoryPreview } from "./StoryPreview";
import { useStoryUpload } from "@/hooks/useStoryUpload";
import { useCreateStory, type CreateStoryItem } from "@/hooks/useStories";
import { notify } from "@/hooks/useToast";

type Step = "type" | "compose" | "preview";

interface AudioData {
  audioUrl: string;
  audioStartTime: number;
  audioEndTime: number;
}

interface StoryData {
  type: StoryType;
  file?: File;
  filePreviewUrl?: string;
  caption: string;
  textContent?: string;
  backgroundColor?: string;
  audio?: AudioData;
}

interface StoryCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StoryCreateDialog({ open, onOpenChange }: StoryCreateDialogProps) {
  const [step, setStep] = useState<Step>("type");
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const upload = useStoryUpload();
  const createStory = useCreateStory();

  const reset = useCallback(() => {
    setStep("type");
    setIsDirty(false);
    setStoryData(null);
    setIsPosting(false);
  }, []);

  const handleClose = useCallback(() => {
    if (isDirty && !isPosting) {
      setShowDiscard(true);
    } else if (!isPosting) {
      reset();
      onOpenChange(false);
    }
  }, [isDirty, isPosting, reset, onOpenChange]);

  const handleDiscard = useCallback(() => {
    setShowDiscard(false);
    reset();
    onOpenChange(false);
  }, [reset, onOpenChange]);

  const handleTypeSelect = useCallback((type: StoryType) => {
    setStoryData({ type, caption: "" });
    setStep("compose");
  }, []);

  const handlePhotoComplete = useCallback(
    (data: { file: File; caption: string; audio?: AudioData }) => {
      setStoryData({
        type: "photo",
        file: data.file,
        filePreviewUrl: URL.createObjectURL(data.file),
        caption: data.caption,
        audio: data.audio,
      });
      setStep("preview");
    },
    []
  );

  const handleVideoComplete = useCallback((data: { file: File; caption: string }) => {
    setStoryData({
      type: "video",
      file: data.file,
      filePreviewUrl: URL.createObjectURL(data.file),
      caption: data.caption,
    });
    setStep("preview");
  }, []);

  const handleTextComplete = useCallback(
    (data: {
      textContent: string;
      backgroundColor: string;
      caption: string;
      audio?: AudioData;
    }) => {
      setStoryData({
        type: "text",
        textContent: data.textContent,
        backgroundColor: data.backgroundColor,
        caption: data.caption,
        audio: data.audio,
      });
      setStep("preview");
    },
    []
  );

  const handlePost = useCallback(async () => {
    if (!storyData || isPosting) return;
    setIsPosting(true);

    try {
      let mediaUrl = "";
      const storyType = storyData.type;

      // Upload media file if needed
      if (storyData.file) {
        const mediaType = storyType === "video" ? "video" : "image";
        const result = await upload.mutateAsync({
          file: storyData.file,
          mediaType,
        });
        mediaUrl = result.url;
      }

      // Build story item
      const item: CreateStoryItem = {
        mediaUrl,
        type: storyType === "photo" ? "IMAGE" : storyType === "video" ? "VIDEO" : "TEXT",
        caption: storyData.caption || undefined,
        duration: storyType === "video" ? 15 : 5,
      };

      // Text story fields
      if (storyType === "text") {
        item.textContent = storyData.textContent;
        item.backgroundColor = storyData.backgroundColor;
      }

      // Audio overlay
      if (storyData.audio) {
        item.audioUrl = storyData.audio.audioUrl;
        item.audioStartTime = storyData.audio.audioStartTime;
        item.audioEndTime = storyData.audio.audioEndTime;
      }

      await createStory.mutateAsync([item]);

      notify.success("Story posted!");
      reset();
      onOpenChange(false);
    } catch {
      notify.error("Failed to post story");
      setIsPosting(false);
    }
  }, [storyData, isPosting, upload, createStory, reset, onOpenChange]);

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : handleClose())}>
        <DialogContent className="flex h-[85vh] max-h-[700px] flex-col overflow-hidden p-0 sm:max-w-md">
          <VisuallyHidden>
            <DialogTitle>Create Story</DialogTitle>
          </VisuallyHidden>

          {step === "type" && <StoryTypeSelector onSelect={handleTypeSelect} />}

          {step === "compose" && storyData?.type === "photo" && (
            <PhotoStoryComposer
              onComplete={handlePhotoComplete}
              onBack={() => setStep("type")}
              onDirty={() => setIsDirty(true)}
            />
          )}

          {step === "compose" && storyData?.type === "video" && (
            <VideoStoryComposer
              onComplete={handleVideoComplete}
              onBack={() => setStep("type")}
              onDirty={() => setIsDirty(true)}
            />
          )}

          {step === "compose" && storyData?.type === "text" && (
            <TextStoryComposer
              onComplete={handleTextComplete}
              onBack={() => setStep("type")}
              onDirty={() => setIsDirty(true)}
            />
          )}

          {step === "preview" && storyData && (
            <StoryPreview
              type={storyData.type}
              filePreviewUrl={storyData.filePreviewUrl}
              textContent={storyData.textContent}
              backgroundColor={storyData.backgroundColor}
              caption={storyData.caption}
              audioUrl={storyData.audio?.audioUrl}
              audioStartTime={storyData.audio?.audioStartTime}
              audioEndTime={storyData.audio?.audioEndTime}
              isPosting={isPosting}
              postProgress={upload.progress}
              onPost={handlePost}
              onBack={() => setStep("compose")}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Discard confirmation */}
      <AlertDialog open={showDiscard} onOpenChange={setShowDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard story?</AlertDialogTitle>
            <AlertDialogDescription>
              Your story hasn&apos;t been posted. If you leave now, your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscard}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
