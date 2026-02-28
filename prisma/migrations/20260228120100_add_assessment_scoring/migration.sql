-- Assessment jadvalida `scoring` ustuni yo'q edi; qo'shamiz.
ALTER TABLE "Assessment" ADD COLUMN "scoring" JSONB NOT NULL DEFAULT '{}';
