-- AlterTable
ALTER TABLE "Post" ADD COLUMN "bloggerPostId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Post_bloggerPostId_key" ON "Post"("bloggerPostId");
