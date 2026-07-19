-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" UUID NOT NULL,
    "baseCurrency" TEXT NOT NULL,
    "targetCurrency" TEXT NOT NULL,
    "rate" DECIMAL(14,6) NOT NULL,
    "provider" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "exchange_rates_baseCurrency_targetCurrency_key"
  ON "exchange_rates"("baseCurrency", "targetCurrency");

CREATE INDEX "exchange_rates_baseCurrency_fetchedAt_idx"
  ON "exchange_rates"("baseCurrency", "fetchedAt");

CREATE INDEX "exchange_rates_targetCurrency_fetchedAt_idx"
  ON "exchange_rates"("targetCurrency", "fetchedAt");
