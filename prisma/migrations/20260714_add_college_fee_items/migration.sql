-- CreateEnum
CREATE TYPE "CollegeFeeBillingPeriod" AS ENUM (
    'TOTAL',
    'ONE_TIME',
    'ADMISSION',
    'INSTALLMENT',
    'MONTHLY',
    'YEARLY',
    'CUSTOM'
);

-- AlterTable
ALTER TABLE "medical_colleges"
ADD COLUMN "exchangeRateUsdToInr" DECIMAL(12,4),
ADD COLUMN "showExchangeRateNote" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "feeNote" TEXT;

-- CreateTable
CREATE TABLE "college_fee_items" (
    "id" UUID NOT NULL,
    "medicalCollegeId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "amountUsd" DECIMAL(12,2),
    "amountInr" DECIMAL(12,2),
    "billingPeriod" "CollegeFeeBillingPeriod" NOT NULL DEFAULT 'CUSTOM',
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isTotal" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "college_fee_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "college_fee_items_medicalCollegeId_sortOrder_idx"
ON "college_fee_items"("medicalCollegeId", "sortOrder");

-- AddForeignKey
ALTER TABLE "college_fee_items"
ADD CONSTRAINT "college_fee_items_medicalCollegeId_fkey"
FOREIGN KEY ("medicalCollegeId") REFERENCES "medical_colleges"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill conservative legacy fee rows from existing decimal columns.
INSERT INTO "college_fee_items" (
    "id",
    "medicalCollegeId",
    "label",
    "amountUsd",
    "billingPeriod",
    "sortOrder",
    "isTotal",
    "isActive",
    "createdAt",
    "updatedAt"
)
SELECT
    (
        substr(md5(random()::text || clock_timestamp()::text || mc."id"::text), 1, 8) || '-' ||
        substr(md5(random()::text || clock_timestamp()::text || mc."id"::text), 9, 4) || '-' ||
        substr(md5(random()::text || clock_timestamp()::text || mc."id"::text), 13, 4) || '-' ||
        substr(md5(random()::text || clock_timestamp()::text || mc."id"::text), 17, 4) || '-' ||
        substr(md5(random()::text || clock_timestamp()::text || mc."id"::text), 21, 12)
    )::uuid,
    mc."id",
    'Total Tuition Fees (Including 1-Year Internship)',
    mc."totalFee",
    'TOTAL',
    1,
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "medical_colleges" mc
WHERE mc."totalFee" IS NOT NULL;

INSERT INTO "college_fee_items" (
    "id",
    "medicalCollegeId",
    "label",
    "amountUsd",
    "billingPeriod",
    "sortOrder",
    "isTotal",
    "isActive",
    "createdAt",
    "updatedAt"
)
SELECT
    (
        substr(md5(random()::text || clock_timestamp()::text || mc."id"::text), 1, 8) || '-' ||
        substr(md5(random()::text || clock_timestamp()::text || mc."id"::text), 9, 4) || '-' ||
        substr(md5(random()::text || clock_timestamp()::text || mc."id"::text), 13, 4) || '-' ||
        substr(md5(random()::text || clock_timestamp()::text || mc."id"::text), 17, 4) || '-' ||
        substr(md5(random()::text || clock_timestamp()::text || mc."id"::text), 21, 12)
    )::uuid,
    mc."id",
    'Legacy Tuition Fee',
    mc."tuitionFee",
    'CUSTOM',
    CASE WHEN mc."totalFee" IS NOT NULL THEN 2 ELSE 1 END,
    false,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "medical_colleges" mc
WHERE mc."tuitionFee" IS NOT NULL;

INSERT INTO "college_fee_items" (
    "id",
    "medicalCollegeId",
    "label",
    "amountUsd",
    "billingPeriod",
    "sortOrder",
    "isTotal",
    "isActive",
    "createdAt",
    "updatedAt"
)
SELECT
    (
        substr(md5(random()::text || clock_timestamp()::text || mc."id"::text), 1, 8) || '-' ||
        substr(md5(random()::text || clock_timestamp()::text || mc."id"::text), 9, 4) || '-' ||
        substr(md5(random()::text || clock_timestamp()::text || mc."id"::text), 13, 4) || '-' ||
        substr(md5(random()::text || clock_timestamp()::text || mc."id"::text), 17, 4) || '-' ||
        substr(md5(random()::text || clock_timestamp()::text || mc."id"::text), 21, 12)
    )::uuid,
    mc."id",
    'Legacy Hostel Fee',
    mc."hostelFee",
    'CUSTOM',
    CASE
        WHEN mc."totalFee" IS NOT NULL AND mc."tuitionFee" IS NOT NULL THEN 3
        WHEN mc."totalFee" IS NOT NULL OR mc."tuitionFee" IS NOT NULL THEN 2
        ELSE 1
    END,
    false,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "medical_colleges" mc
WHERE mc."hostelFee" IS NOT NULL;
