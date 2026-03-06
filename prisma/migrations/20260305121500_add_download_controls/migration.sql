-- AlterTable
ALTER TABLE "Music"
ADD COLUMN "enableDownload" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Post"
ADD COLUMN "downloadCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "downloadLabel" TEXT,
ADD COLUMN "downloadMediaId" TEXT,
ADD COLUMN "enableDownload" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Post_downloadMediaId_idx" ON "Post"("downloadMediaId");

-- AddForeignKey
ALTER TABLE "Post"
ADD CONSTRAINT "Post_downloadMediaId_fkey"
FOREIGN KEY ("downloadMediaId") REFERENCES "Media"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
