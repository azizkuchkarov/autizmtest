-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "childId" TEXT;

-- CreateTable
CREATE TABLE "SoundAnswer" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "cardId" TEXT,
    "level" INTEGER NOT NULL,
    "result" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "snapshot" BOOLEAN NOT NULL DEFAULT false,
    "at" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SoundAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaySession" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AacDay" (
    "childId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "taps" INTEGER NOT NULL DEFAULT 0,
    "sentences" INTEGER NOT NULL DEFAULT 0,
    "sentenceWords" INTEGER NOT NULL DEFAULT 0,
    "cards" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AacDay_pkey" PRIMARY KEY ("childId","day")
);

-- CreateTable
CREATE TABLE "SyncReceipt" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SoundAnswer_childId_at_idx" ON "SoundAnswer"("childId", "at");

-- CreateIndex
CREATE INDEX "PlaySession_childId_at_idx" ON "PlaySession"("childId", "at");

-- CreateIndex
CREATE INDEX "SyncReceipt_childId_idx" ON "SyncReceipt"("childId");

-- CreateIndex
CREATE INDEX "Assessment_childId_idx" ON "Assessment"("childId");

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoundAnswer" ADD CONSTRAINT "SoundAnswer_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaySession" ADD CONSTRAINT "PlaySession_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AacDay" ADD CONSTRAINT "AacDay_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncReceipt" ADD CONSTRAINT "SyncReceipt_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

