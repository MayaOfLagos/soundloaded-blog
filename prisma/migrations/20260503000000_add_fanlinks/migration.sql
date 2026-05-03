-- CreateEnum
CREATE TYPE "FanlinkType" AS ENUM ('SINGLE', 'ALBUM', 'EP', 'MIXTAPE');

-- CreateEnum
CREATE TYPE "FanlinkStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "Fanlink" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artistName" TEXT NOT NULL,
    "type" "FanlinkType" NOT NULL DEFAULT 'SINGLE',
    "releaseDate" TIMESTAMP(3),
    "description" TEXT,
    "genre" TEXT,
    "coverArt" TEXT,
    "bgColor" TEXT,
    "accentColor" TEXT,
    "buttonStyle" TEXT NOT NULL DEFAULT 'filled',
    "pageTheme" TEXT NOT NULL DEFAULT 'dark',
    "musicId" TEXT,
    "artistId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "platformLinks" JSONB NOT NULL DEFAULT '[]',
    "emailCaptureEnabled" BOOLEAN NOT NULL DEFAULT false,
    "emailCapturePrompt" TEXT NOT NULL DEFAULT 'Enter your email to unlock',
    "showSocialIcons" BOOLEAN NOT NULL DEFAULT true,
    "tipEnabled" BOOLEAN NOT NULL DEFAULT false,
    "tipLabel" TEXT NOT NULL DEFAULT 'Support this artist',
    "tipAmounts" JSONB NOT NULL DEFAULT '[200,500,1000]',
    "merchUrl" TEXT,
    "merchLabel" TEXT,
    "metaPixelId" TEXT,
    "gaId" TEXT,
    "ogImage" TEXT,
    "preSaveEnabled" BOOLEAN NOT NULL DEFAULT false,
    "status" "FanlinkStatus" NOT NULL DEFAULT 'DRAFT',
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fanlink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FanlinkClick" (
    "id" TEXT NOT NULL,
    "fanlinkId" TEXT NOT NULL,
    "platform" TEXT,
    "ip" TEXT,
    "country" TEXT,
    "city" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "referrer" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FanlinkClick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FanlinkEmail" (
    "id" TEXT NOT NULL,
    "fanlinkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FanlinkEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FanlinkTip" (
    "id" TEXT NOT NULL,
    "fanlinkId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "txRef" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payerEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FanlinkTip_pkey" PRIMARY KEY ("id")
);

-- AlterTable: add enableFanlinks + indexNowKey to SiteSettings
ALTER TABLE "SiteSettings" ADD COLUMN "enableFanlinks" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SiteSettings" ADD COLUMN "indexNowKey" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "Fanlink_slug_key" ON "Fanlink"("slug");
CREATE INDEX "Fanlink_artistId_idx" ON "Fanlink"("artistId");
CREATE INDEX "Fanlink_createdById_idx" ON "Fanlink"("createdById");
CREATE INDEX "Fanlink_status_createdAt_idx" ON "Fanlink"("status", "createdAt");

CREATE INDEX "FanlinkClick_fanlinkId_createdAt_idx" ON "FanlinkClick"("fanlinkId", "createdAt");
CREATE INDEX "FanlinkClick_fanlinkId_platform_idx" ON "FanlinkClick"("fanlinkId", "platform");
CREATE INDEX "FanlinkClick_createdAt_idx" ON "FanlinkClick"("createdAt");

CREATE UNIQUE INDEX "FanlinkEmail_fanlinkId_email_key" ON "FanlinkEmail"("fanlinkId", "email");
CREATE INDEX "FanlinkEmail_fanlinkId_idx" ON "FanlinkEmail"("fanlinkId");

CREATE UNIQUE INDEX "FanlinkTip_txRef_key" ON "FanlinkTip"("txRef");
CREATE INDEX "FanlinkTip_fanlinkId_idx" ON "FanlinkTip"("fanlinkId");
CREATE INDEX "FanlinkTip_txRef_idx" ON "FanlinkTip"("txRef");

-- AddForeignKey
ALTER TABLE "Fanlink" ADD CONSTRAINT "Fanlink_musicId_fkey" FOREIGN KEY ("musicId") REFERENCES "Music"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Fanlink" ADD CONSTRAINT "Fanlink_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Fanlink" ADD CONSTRAINT "Fanlink_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FanlinkClick" ADD CONSTRAINT "FanlinkClick_fanlinkId_fkey" FOREIGN KEY ("fanlinkId") REFERENCES "Fanlink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FanlinkEmail" ADD CONSTRAINT "FanlinkEmail_fanlinkId_fkey" FOREIGN KEY ("fanlinkId") REFERENCES "Fanlink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FanlinkTip" ADD CONSTRAINT "FanlinkTip_fanlinkId_fkey" FOREIGN KEY ("fanlinkId") REFERENCES "Fanlink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
