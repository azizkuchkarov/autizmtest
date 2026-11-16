-- Hammasi "IF NOT EXISTS": ilgari "prisma db push" bilan o'zgartirilgan bazada ham, yangi bazada ham xatosiz ishlaydi.

-- OTP: kod boshiga tasdiqlashga urinishlar soni (5 tadan keyin kod ishlamaydi)
ALTER TABLE "OtpCode" ADD COLUMN IF NOT EXISTS "attempts" INTEGER NOT NULL DEFAULT 0;

-- Sxemada bor, lekin migratsiyalar tarixida yo'q edi (production'ga db push bilan qo'shilgan): yangi bazada ham bo'lsin
ALTER TABLE "AbaCenter" ADD COLUMN IF NOT EXISTS "telegramId" TEXT;
ALTER TABLE "Assessment" ALTER COLUMN "scoring" DROP DEFAULT;

-- Loglar va admin statistikasi (type + vaqt bo'yicha), akkaunt o'chirilganda sessiyalar
CREATE INDEX IF NOT EXISTS "UserEvent_createdAt_idx" ON "UserEvent"("createdAt");
CREATE INDEX IF NOT EXISTS "UserEvent_type_createdAt_idx" ON "UserEvent"("type", "createdAt");
CREATE INDEX IF NOT EXISTS "UserSession_userId_idx" ON "UserSession"("userId");
