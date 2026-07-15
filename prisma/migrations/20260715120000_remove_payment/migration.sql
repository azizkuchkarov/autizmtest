-- DropForeignKey
ALTER TABLE "Assessment" DROP CONSTRAINT IF EXISTS "Assessment_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "PromoCode" DROP CONSTRAINT IF EXISTS "PromoCode_assessmentId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "Assessment_paymentId_idx";

-- DropIndex
DROP INDEX IF EXISTS "PromoCode_assessmentId_idx";

-- DropIndex
DROP INDEX IF EXISTS "PromoCode_code_idx";

-- AlterTable
ALTER TABLE "Assessment" DROP COLUMN IF EXISTS "paymentId";
ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "phone" TEXT;

-- DropTable
DROP TABLE IF EXISTS "PromoCode";

-- DropTable
DROP TABLE IF EXISTS "Payment";
