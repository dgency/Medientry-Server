ALTER TABLE "site_settings"
ADD COLUMN "exchangeRateUsdToInr" DECIMAL(12,4),
ADD COLUMN "showExchangeRateNote" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "customExchangeRateNote" TEXT,
ADD COLUMN "exchangeRateUpdatedAt" TIMESTAMP(3);

WITH "legacy_exchange_rate_configs" AS (
  SELECT DISTINCT
    "exchangeRateUsdToInr",
    "showExchangeRateNote",
    NULLIF(BTRIM("feeNote"), '') AS "customExchangeRateNote"
  FROM "medical_colleges"
  WHERE
    "exchangeRateUsdToInr" IS NOT NULL
    OR "showExchangeRateNote" = true
    OR NULLIF(BTRIM("feeNote"), '') IS NOT NULL
),
"chosen_legacy_exchange_rate_config" AS (
  SELECT
    "exchangeRateUsdToInr",
    "showExchangeRateNote",
    "customExchangeRateNote"
  FROM "legacy_exchange_rate_configs"
  WHERE (SELECT COUNT(*) FROM "legacy_exchange_rate_configs") = 1
)
UPDATE "site_settings"
SET
  "exchangeRateUsdToInr" = "chosen_legacy_exchange_rate_config"."exchangeRateUsdToInr",
  "showExchangeRateNote" = "chosen_legacy_exchange_rate_config"."showExchangeRateNote",
  "customExchangeRateNote" = "chosen_legacy_exchange_rate_config"."customExchangeRateNote",
  "exchangeRateUpdatedAt" = NOW()
FROM "chosen_legacy_exchange_rate_config"
WHERE "site_settings"."id" = (
  SELECT "id"
  FROM "site_settings"
  ORDER BY "createdAt" ASC
  LIMIT 1
)
AND "site_settings"."exchangeRateUsdToInr" IS NULL
AND "site_settings"."showExchangeRateNote" = false
AND "site_settings"."customExchangeRateNote" IS NULL
AND "site_settings"."exchangeRateUpdatedAt" IS NULL;
