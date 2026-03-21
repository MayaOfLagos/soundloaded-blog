-- Add verified field to Artist
ALTER TABLE "Artist" ADD COLUMN IF NOT EXISTS "verified" BOOLEAN NOT NULL DEFAULT false;
