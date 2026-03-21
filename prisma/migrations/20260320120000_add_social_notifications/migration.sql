-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'NEW_FOLLOWER';
ALTER TYPE "NotificationType" ADD VALUE 'REACTION';
ALTER TYPE "NotificationType" ADD VALUE 'NEW_COMMENT';

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "actorId" TEXT;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Notification_actorId_idx" ON "Notification"("actorId");
