-- Ota-ona qaysi videoni qayergacha ko'rgani
CREATE TABLE "VideoWatch" (
    "userId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "positionSec" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoWatch_pkey" PRIMARY KEY ("userId","videoId")
);

CREATE INDEX "VideoWatch_videoId_idx" ON "VideoWatch"("videoId");

ALTER TABLE "VideoWatch" ADD CONSTRAINT "VideoWatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VideoWatch" ADD CONSTRAINT "VideoWatch_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Hamma videolar Darslar bo'limlarida: uy mashqlari videolari tegishli bo'limga o'tadi
UPDATE "ContentCategory" SET "kind" = 'lesson', "order" = "order" + 10 WHERE "kind" = 'exercise';

UPDATE "Profession" SET "titleUz" = 'Sensomotorika', "titleRu" = 'Сенсомоторика' WHERE "slug" = 'sensory';
