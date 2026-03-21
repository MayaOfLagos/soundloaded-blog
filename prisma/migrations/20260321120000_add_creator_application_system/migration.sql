-- CreateEnum
CREATE TYPE "CreatorType" AS ENUM ('ARTIST', 'LABEL');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'APPLICATION_SUBMITTED';
ALTER TYPE "NotificationType" ADD VALUE 'APPLICATION_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'APPLICATION_REJECTED';

-- CreateTable: Label (must be created before Artist FK references it)
CREATE TABLE "Label" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bio" TEXT,
    "logo" TEXT,
    "coverImage" TEXT,
    "country" TEXT DEFAULT 'Nigeria',
    "website" TEXT,
    "instagram" TEXT,
    "twitter" TEXT,
    "facebook" TEXT,
    "spotify" TEXT,
    "appleMusic" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Label_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Label_slug_key" ON "Label"("slug");
CREATE UNIQUE INDEX "Label_ownerId_key" ON "Label"("ownerId");
CREATE INDEX "Label_slug_idx" ON "Label"("slug");
CREATE INDEX "Label_ownerId_idx" ON "Label"("ownerId");

ALTER TABLE "Label" ADD CONSTRAINT "Label_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: Add ownerId and labelId to Artist
ALTER TABLE "Artist" ADD COLUMN "ownerId" TEXT,
ADD COLUMN "labelId" TEXT;

CREATE UNIQUE INDEX "Artist_ownerId_key" ON "Artist"("ownerId");
CREATE INDEX "Artist_ownerId_idx" ON "Artist"("ownerId");
CREATE INDEX "Artist_labelId_idx" ON "Artist"("labelId");

ALTER TABLE "Artist" ADD CONSTRAINT "Artist_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Artist" ADD CONSTRAINT "Artist_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "Label"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: CreatorApplication
CREATE TABLE "CreatorApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "CreatorType" NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "displayName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bio" TEXT,
    "genre" TEXT,
    "country" TEXT DEFAULT 'Nigeria',
    "photo" TEXT,
    "socialLinks" JSONB,
    "proofUrls" JSONB,
    "reviewedById" TEXT,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorApplication_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CreatorApplication_status_createdAt_idx" ON "CreatorApplication"("status", "createdAt");
CREATE INDEX "CreatorApplication_userId_idx" ON "CreatorApplication"("userId");

ALTER TABLE "CreatorApplication" ADD CONSTRAINT "CreatorApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreatorApplication" ADD CONSTRAINT "CreatorApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
