-- Phase 3: A/B variant fields on Fanlink + FanlinkVariant table

ALTER TABLE "Fanlink"
  ADD COLUMN IF NOT EXISTS "abEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "abSplit"   INTEGER NOT NULL DEFAULT 50;

CREATE TABLE IF NOT EXISTS "FanlinkVariant" (
  "id"            TEXT NOT NULL,
  "fanlinkId"     TEXT NOT NULL,
  "label"         TEXT NOT NULL DEFAULT 'B',
  "title"         TEXT,
  "description"   TEXT,
  "coverArt"      TEXT,
  "accentColor"   TEXT,
  "platformLinks" JSONB NOT NULL DEFAULT '[]',
  "clicks"        INTEGER NOT NULL DEFAULT 0,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "FanlinkVariant_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FanlinkVariant_fanlinkId_fkey"
    FOREIGN KEY ("fanlinkId") REFERENCES "Fanlink"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "FanlinkVariant_fanlinkId_idx" ON "FanlinkVariant"("fanlinkId");
