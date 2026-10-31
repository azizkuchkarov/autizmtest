-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "processError" TEXT,
ADD COLUMN     "sourceFile" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ready';
