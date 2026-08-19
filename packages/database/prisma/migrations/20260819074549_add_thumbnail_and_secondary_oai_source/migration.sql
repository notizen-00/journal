-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "thumbnailUrl" TEXT;

-- AlterTable
ALTER TABLE "journal_sources" ADD COLUMN     "oaiEndpoint2" TEXT,
ADD COLUMN     "oaiSetSpec2" TEXT,
ADD COLUMN     "ojsUrl2" TEXT;
