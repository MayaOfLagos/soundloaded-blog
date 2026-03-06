-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "categoryBase" TEXT NOT NULL DEFAULT 'category',
ADD COLUMN     "permalinkStructure" TEXT NOT NULL DEFAULT '/%postname%';
