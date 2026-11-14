-- To'lov endi skrining natijasi uchun emas, Darslar bo'limiga oylik kirish uchun. Promokodlar olib tashlandi.
ALTER TABLE "Assessment" DROP CONSTRAINT IF EXISTS "Assessment_paymentId_fkey";
DROP INDEX IF EXISTS "Assessment_paymentId_idx";
ALTER TABLE "Assessment" DROP COLUMN IF EXISTS "paymentId";
ALTER TABLE "Assessment" DROP COLUMN IF EXISTS "requiresPayment";

DROP TABLE IF EXISTS "PromoCode";

ALTER TABLE "Payment" ADD COLUMN "userId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "days" INTEGER NOT NULL DEFAULT 30;
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "User" ADD COLUMN "lessonsPaidUntil" TIMESTAMP(3);
