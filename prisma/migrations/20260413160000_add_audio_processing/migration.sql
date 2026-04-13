-- Add audio processing fields to Music table
ALTER TABLE "Music" ADD COLUMN "processedR2Key" TEXT;
ALTER TABLE "Music" ADD COLUMN "processedFormat" TEXT;
ALTER TABLE "Music" ADD COLUMN "processedBitrate" INTEGER;
ALTER TABLE "Music" ADD COLUMN "processedSize" BIGINT;
ALTER TABLE "Music" ADD COLUMN "loudnessLUFS" DOUBLE PRECISION;
ALTER TABLE "Music" ADD COLUMN "waveformData" JSONB;
ALTER TABLE "Music" ADD COLUMN "processingStatus" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "Music" ADD COLUMN "processingError" TEXT;

-- Audio Processing Jobs table (database-backed job queue)
CREATE TABLE "AudioProcessingJob" (
    "id" TEXT NOT NULL,
    "musicId" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "error" TEXT,
    "result" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AudioProcessingJob_pkey" PRIMARY KEY ("id")
);

-- Indexes for efficient job polling
CREATE INDEX "AudioProcessingJob_status_priority_createdAt_idx"
    ON "AudioProcessingJob"("status", "priority", "createdAt");
CREATE INDEX "AudioProcessingJob_musicId_idx"
    ON "AudioProcessingJob"("musicId");

-- Foreign key
ALTER TABLE "AudioProcessingJob"
    ADD CONSTRAINT "AudioProcessingJob_musicId_fkey"
    FOREIGN KEY ("musicId") REFERENCES "Music"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
