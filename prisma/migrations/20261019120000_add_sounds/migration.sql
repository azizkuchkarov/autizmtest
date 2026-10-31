-- CreateTable
CREATE TABLE "SoundSet" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleUz" TEXT NOT NULL,
    "titleRu" TEXT NOT NULL,
    "descriptionUz" TEXT,
    "descriptionRu" TEXT,
    "emoji" TEXT,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoundSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoundCard" (
    "id" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "titleUz" TEXT NOT NULL,
    "titleRu" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "imageUrl" TEXT,
    "emoji" TEXT,
    "loud" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoundCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SoundSet_slug_key" ON "SoundSet"("slug");
CREATE INDEX "SoundCard_setId_idx" ON "SoundCard"("setId");

-- AddForeignKey
ALTER TABLE "SoundCard" ADD CONSTRAINT "SoundCard_setId_fkey" FOREIGN KEY ("setId") REFERENCES "SoundSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
