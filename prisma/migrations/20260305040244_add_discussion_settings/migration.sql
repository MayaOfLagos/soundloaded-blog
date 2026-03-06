-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "commentMaxLinks" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "commentPreviouslyApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailOnModeration" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailOnNewComment" BOOLEAN NOT NULL DEFAULT true;
