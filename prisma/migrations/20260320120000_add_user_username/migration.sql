-- AlterTable
ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- Backfill existing users with a default username based on their cuid id
UPDATE "User" SET "username" = CONCAT('user-', SUBSTRING("id", 1, 8)) WHERE "username" IS NULL;
