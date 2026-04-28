-- Add Soundloaded-managed evergreen pages.
CREATE TABLE "Page" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "excerpt" TEXT,
  "body" JSONB NOT NULL,
  "coverImage" TEXT,
  "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
  "template" TEXT NOT NULL DEFAULT 'DEFAULT',
  "publishedAt" TIMESTAMP(3),
  "views" INTEGER NOT NULL DEFAULT 0,
  "authorId" TEXT,
  "showInHeader" BOOLEAN NOT NULL DEFAULT false,
  "showInFooter" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "systemKey" TEXT,
  "metaTitle" TEXT,
  "metaDescription" TEXT,
  "focusKeyword" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");
CREATE UNIQUE INDEX "Page_systemKey_key" ON "Page"("systemKey");
CREATE INDEX "Page_slug_idx" ON "Page"("slug");
CREATE INDEX "Page_status_publishedAt_idx" ON "Page"("status", "publishedAt");
CREATE INDEX "Page_showInHeader_sortOrder_idx" ON "Page"("showInHeader", "sortOrder");
CREATE INDEX "Page_showInFooter_sortOrder_idx" ON "Page"("showInFooter", "sortOrder");
CREATE INDEX "Page_systemKey_idx" ON "Page"("systemKey");

ALTER TABLE "Page"
  ADD CONSTRAINT "Page_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
