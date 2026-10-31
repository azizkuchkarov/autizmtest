-- AlterTable
ALTER TABLE "OtpCode" ADD COLUMN     "channel" TEXT NOT NULL DEFAULT 'sms',
ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'uz',
ADD COLUMN     "tgChatId" TEXT,
ADD COLUMN     "tgToken" TEXT;

-- CreateTable
CREATE TABLE "TelegramLink" (
    "phone" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "tgUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramLink_pkey" PRIMARY KEY ("phone")
);

-- CreateIndex
CREATE UNIQUE INDEX "OtpCode_tgToken_key" ON "OtpCode"("tgToken");

-- CreateIndex
CREATE INDEX "OtpCode_tgChatId_idx" ON "OtpCode"("tgChatId");

-- CreateIndex
CREATE INDEX "TelegramLink_chatId_idx" ON "TelegramLink"("chatId");
