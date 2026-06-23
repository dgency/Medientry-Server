ALTER TABLE "medical_colleges"
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

UPDATE "medical_colleges"
SET "sortOrder" = ordered.col_order
FROM (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "name" ASC) AS col_order
  FROM "medical_colleges"
) AS ordered
WHERE "medical_colleges"."id" = ordered."id";

DROP INDEX IF EXISTS "medical_colleges_isFeatured_status_idx";

CREATE INDEX "medical_colleges_isFeatured_status_sortOrder_idx"
ON "medical_colleges"("isFeatured", "status", "sortOrder");
