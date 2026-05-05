-- Add variant column to FanlinkClick for A/B testing tracking
ALTER TABLE "FanlinkClick" ADD COLUMN "variant" TEXT;

-- Create index for variant analytics queries
CREATE INDEX "FanlinkClick_fanlinkId_variant_idx" ON "FanlinkClick"("fanlinkId", "variant");
