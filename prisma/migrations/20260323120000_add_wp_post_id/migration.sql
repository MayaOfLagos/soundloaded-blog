-- AlterTable
ALTER TABLE "Post" ADD COLUMN "wpPostId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Post_wpPostId_key" ON "Post"("wpPostId");
