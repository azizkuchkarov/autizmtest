-- AI xulosa loyihadan olib tashlandi: saqlangan AI matnlari va prompt jadvali o'chiriladi
ALTER TABLE "Assessment"
  DROP COLUMN IF EXISTS "aiSummaryStatus",
  DROP COLUMN IF EXISTS "aiSummaryPayload",
  DROP COLUMN IF EXISTS "aiSummaryLocale",
  DROP COLUMN IF EXISTS "aiSummaryError";

DROP TABLE IF EXISTS "AiPrompt";
