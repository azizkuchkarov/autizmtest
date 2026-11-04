-- Video mashq uchun qachon belgilangani: Mashqlarda shu tartibda ko'rsatiladi
ALTER TABLE "Video" ADD COLUMN "exerciseMarkedAt" TIMESTAMP(3);
UPDATE "Video" SET "exerciseMarkedAt" = "updatedAt" WHERE "exerciseEnabled" = true;
