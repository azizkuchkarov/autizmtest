-- AlterTable
ALTER TABLE "User" ADD COLUMN "guideSeenAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Child" ADD COLUMN "practiceTime" TEXT,
ADD COLUMN "diaryTime" TEXT,
ADD COLUMN "remindersOn" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "DiaryEntry" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "bedTime" TEXT,
    "wakeTime" TEXT,
    "nightWakings" INTEGER,
    "mood" INTEGER,
    "breakfast" TEXT,
    "appetite" TEXT,
    "meltdowns" INTEGER,
    "selfHarm" BOOLEAN,
    "repetitive" TEXT,
    "eyeContact" TEXT,
    "requests" TEXT,
    "sick" BOOLEAN,
    "constipation" BOOLEAN,
    "medicine" BOOLEAN,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiaryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiaryEntry_childId_date_key" ON "DiaryEntry"("childId", "date");

-- AddForeignKey
ALTER TABLE "DiaryEntry" ADD CONSTRAINT "DiaryEntry_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
