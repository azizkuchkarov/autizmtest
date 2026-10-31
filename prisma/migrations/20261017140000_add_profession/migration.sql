-- CreateTable
CREATE TABLE "Profession" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleUz" TEXT NOT NULL,
    "titleRu" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Profession_slug_key" ON "Profession"("slug");

-- Boshlang'ich yo'nalishlar
INSERT INTO "Profession" ("id", "slug", "titleUz", "titleRu", "order", "updatedAt") VALUES
    ('prof-autism', 'autism', 'Autizm', 'Аутизм', 0, CURRENT_TIMESTAMP),
    ('prof-speech', 'speech', 'Logoped', 'Логопед', 1, CURRENT_TIMESTAMP),
    ('prof-sensory', 'sensory', 'Sensor integratsiya', 'Сенсорная интеграция', 2, CURRENT_TIMESTAMP),
    ('prof-psychology', 'psychology', 'Psixolog', 'Психолог', 3, CURRENT_TIMESTAMP),
    ('prof-defectology', 'defectology', 'Defektolog', 'Дефектолог', 4, CURRENT_TIMESTAMP);

-- Mavjud mavzular autizm yo'nalishiga o'tadi
ALTER TABLE "ContentCategory" ADD COLUMN "professionId" TEXT;
UPDATE "ContentCategory" SET "professionId" = 'prof-autism';
ALTER TABLE "ContentCategory" ALTER COLUMN "professionId" SET NOT NULL;

CREATE INDEX "ContentCategory_professionId_idx" ON "ContentCategory"("professionId");

ALTER TABLE "ContentCategory" ADD CONSTRAINT "ContentCategory_professionId_fkey" FOREIGN KEY ("professionId") REFERENCES "Profession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
