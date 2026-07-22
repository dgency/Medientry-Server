ALTER TABLE "consultation_leads"
  ADD COLUMN "readAt" TIMESTAMP(3);

UPDATE "consultation_leads"
SET "readAt" = COALESCE("createdAt", CURRENT_TIMESTAMP)
WHERE "readAt" IS NULL;

CREATE INDEX "consultation_leads_readAt_createdAt_idx"
  ON "consultation_leads"("readAt", "createdAt");
