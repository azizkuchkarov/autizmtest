-- CreateTable
CREATE TABLE "AacCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleUz" TEXT NOT NULL,
    "titleRu" TEXT NOT NULL,
    "emoji" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AacCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AacCard" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "titleUz" TEXT NOT NULL,
    "titleRu" TEXT NOT NULL,
    "speakUz" TEXT,
    "speakRu" TEXT,
    "emoji" TEXT,
    "imageUrl" TEXT,
    "audioUzUrl" TEXT,
    "audioRuUrl" TEXT,
    "wordType" TEXT NOT NULL DEFAULT 'noun',
    "core" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AacCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AacCategory_slug_key" ON "AacCategory"("slug");
CREATE INDEX "AacCard_categoryId_idx" ON "AacCard"("categoryId");

-- AddForeignKey
ALTER TABLE "AacCard" ADD CONSTRAINT "AacCard_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AacCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
