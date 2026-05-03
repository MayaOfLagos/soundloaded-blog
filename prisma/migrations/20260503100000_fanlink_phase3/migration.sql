-- Phase 3: Pre-save + Fan-gate fields on Fanlink

ALTER TABLE "Fanlink"
  ADD COLUMN IF NOT EXISTS "preSaveSpotifyUrl"  TEXT,
  ADD COLUMN IF NOT EXISTS "preSaveAppleUrl"    TEXT,
  ADD COLUMN IF NOT EXISTS "preSaveDeezerUrl"   TEXT,
  ADD COLUMN IF NOT EXISTS "preSaveMessage"     TEXT NOT NULL DEFAULT 'Save this track before it drops!',
  ADD COLUMN IF NOT EXISTS "fanGateEnabled"     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "fanGateAction"      TEXT NOT NULL DEFAULT 'follow',
  ADD COLUMN IF NOT EXISTS "fanGateSpotifyUrl"  TEXT,
  ADD COLUMN IF NOT EXISTS "fanGateTwitterText" TEXT;
