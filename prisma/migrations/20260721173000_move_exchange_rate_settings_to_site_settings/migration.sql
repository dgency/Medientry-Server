ALTER TABLE "site_settings"
ADD COLUMN IF NOT EXISTS "exchangeRateUsdToInr" DECIMAL(12,4),
ADD COLUMN IF NOT EXISTS "showExchangeRateNote" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "customExchangeRateNote" TEXT,
ADD COLUMN IF NOT EXISTS "exchangeRateUpdatedAt" TIMESTAMP(3);

INSERT INTO "site_settings" (
  "id",
  "showExchangeRateNote",
  "createdAt",
  "updatedAt"
)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid,
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1
  FROM "site_settings"
);

DO $$
DECLARE
  latest_college_record RECORD;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'medical_colleges'
      AND column_name = 'exchangeRateUsdToInr'
  ) THEN
    EXECUTE '
      SELECT
        "exchangeRateUsdToInr",
        "showExchangeRateNote",
        "feeNote",
        "updatedAt"
      FROM "medical_colleges"
      WHERE "exchangeRateUsdToInr" IS NOT NULL
         OR "showExchangeRateNote" = true
         OR "feeNote" IS NOT NULL
      ORDER BY "updatedAt" DESC
      LIMIT 1
    '
    INTO latest_college_record;

    IF latest_college_record IS NOT NULL THEN
      UPDATE "site_settings"
      SET
        "exchangeRateUsdToInr" = COALESCE("exchangeRateUsdToInr", latest_college_record."exchangeRateUsdToInr"),
        "showExchangeRateNote" = CASE
          WHEN "exchangeRateUsdToInr" IS NULL
            AND "customExchangeRateNote" IS NULL
            AND "exchangeRateUpdatedAt" IS NULL
          THEN latest_college_record."showExchangeRateNote"
          ELSE "showExchangeRateNote"
        END,
        "customExchangeRateNote" = COALESCE("customExchangeRateNote", latest_college_record."feeNote"),
        "exchangeRateUpdatedAt" = COALESCE("exchangeRateUpdatedAt", latest_college_record."updatedAt"),
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = (
        SELECT "id"
        FROM "site_settings"
        ORDER BY "createdAt" ASC
        LIMIT 1
      );
    END IF;
  END IF;
END $$;
