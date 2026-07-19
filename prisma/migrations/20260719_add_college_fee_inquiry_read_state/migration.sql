ALTER TABLE "college_fee_inquiries"
  ADD COLUMN "readAt" TIMESTAMP(3);

UPDATE "college_fee_inquiries"
SET "readAt" = COALESCE("createdAt", CURRENT_TIMESTAMP)
WHERE "readAt" IS NULL;

CREATE INDEX "college_fee_inquiries_readAt_createdAt_idx"
  ON "college_fee_inquiries"("readAt", "createdAt");
