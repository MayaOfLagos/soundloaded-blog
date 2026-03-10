-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY', 'FIRE', 'CLAP', 'HUNDRED', 'CELEBRATE', 'GRATEFUL');

-- CreateTable
CREATE TABLE "Reaction" (
    "id" TEXT NOT NULL,
    "type" "ReactionType" NOT NULL DEFAULT 'LOVE',
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reaction_postId_type_idx" ON "Reaction"("postId", "type");

-- CreateIndex
CREATE INDEX "Reaction_userId_createdAt_idx" ON "Reaction"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_userId_postId_key" ON "Reaction"("userId", "postId");

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
