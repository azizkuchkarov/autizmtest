-- Mashq uchun videolar va ota-ona tanlagan video mashqlar
ALTER TABLE "Video" ADD COLUMN "exerciseEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "exerciseReps" INTEGER,
ADD COLUMN "exerciseDays" INTEGER;

CREATE TABLE "ExercisePlan" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "repsPerDay" INTEGER NOT NULL,
    "days" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExercisePlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExerciseDayLog" (
    "planId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ExerciseDayLog_pkey" PRIMARY KEY ("planId","day")
);

CREATE UNIQUE INDEX "ExercisePlan_childId_videoId_key" ON "ExercisePlan"("childId", "videoId");
CREATE INDEX "ExercisePlan_videoId_idx" ON "ExercisePlan"("videoId");

ALTER TABLE "ExercisePlan" ADD CONSTRAINT "ExercisePlan_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExercisePlan" ADD CONSTRAINT "ExercisePlan_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExerciseDayLog" ADD CONSTRAINT "ExerciseDayLog_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ExercisePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
