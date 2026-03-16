-- AlterEnum
ALTER TYPE "PostType" ADD VALUE 'COMMUNITY';

-- AlterTable
ALTER TABLE "Post" ADD COLUMN "isUserGenerated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Post" ADD COLUMN "mediaAttachments" JSONB NOT NULL DEFAULT '[]';

-- CreateIndex
CREATE INDEX "Post_isUserGenerated_status_createdAt_idx" ON "Post"("isUserGenerated", "status", "createdAt");
