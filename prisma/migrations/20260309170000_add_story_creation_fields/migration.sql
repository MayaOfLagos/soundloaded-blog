-- AlterEnum
ALTER TYPE "StoryItemType" ADD VALUE 'TEXT';

-- AlterTable
ALTER TABLE "StoryItem" ADD COLUMN     "audioEndTime" DOUBLE PRECISION DEFAULT 30,
ADD COLUMN     "audioStartTime" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "audioUrl" TEXT,
ADD COLUMN     "backgroundColor" TEXT,
ADD COLUMN     "textContent" TEXT;
