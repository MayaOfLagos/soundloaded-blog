-- DropIndex
DROP INDEX "Reaction_postId_type_idx";

-- AlterTable
ALTER TABLE "Reaction" DROP COLUMN "type",
ADD COLUMN     "emoji" TEXT NOT NULL DEFAULT '❤️';

-- DropEnum
DROP TYPE "ReactionType";

-- CreateIndex
CREATE INDEX "Reaction_postId_emoji_idx" ON "Reaction"("postId", "emoji");
