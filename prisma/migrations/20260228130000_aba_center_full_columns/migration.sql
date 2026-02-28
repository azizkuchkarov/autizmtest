-- AbaCenter jadvaliga schema'dagi barcha ustunlarni qo'shish (GET 500 va saqlash ishlashi uchun)
ALTER TABLE "AbaCenter" ADD COLUMN "url" TEXT;
ALTER TABLE "AbaCenter" ADD COLUMN "instagram" TEXT;
ALTER TABLE "AbaCenter" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "AbaCenter" ADD COLUMN "directorName" TEXT;
ALTER TABLE "AbaCenter" ADD COLUMN "directorImageUrl" TEXT;
ALTER TABLE "AbaCenter" ADD COLUMN "directorBio" TEXT;
ALTER TABLE "AbaCenter" ADD COLUMN "amenities" JSONB;
ALTER TABLE "AbaCenter" ADD COLUMN "portfolioDescription" TEXT;
