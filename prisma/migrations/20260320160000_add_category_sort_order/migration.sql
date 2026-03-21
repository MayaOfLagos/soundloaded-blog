-- AlterTable
ALTER TABLE "Category" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Initialize sortOrder based on alphabetical name order
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name ASC) - 1 AS rn
  FROM "Category"
)
UPDATE "Category" SET "sortOrder" = ranked.rn FROM ranked WHERE "Category".id = ranked.id;

-- CreateIndex
CREATE INDEX "Category_sortOrder_idx" ON "Category"("sortOrder");
