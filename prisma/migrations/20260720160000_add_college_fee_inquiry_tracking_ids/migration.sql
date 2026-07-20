CREATE SEQUENCE "college_fee_inquiry_tracking_number_seq";

ALTER TABLE "college_fee_inquiries"
ADD COLUMN "trackingNumber" INTEGER,
ADD COLUMN "trackingId" TEXT;

WITH ordered_inquiries AS (
  SELECT
    "id",
    nextval('"college_fee_inquiry_tracking_number_seq"')::INTEGER AS tracking_number
  FROM "college_fee_inquiries"
  ORDER BY "createdAt" ASC, "id" ASC
)
UPDATE "college_fee_inquiries" AS inquiry
SET
  "trackingNumber" = ordered_inquiries.tracking_number,
  "trackingId" = 'INQ-' || LPAD(ordered_inquiries.tracking_number::TEXT, 3, '0')
FROM ordered_inquiries
WHERE inquiry."id" = ordered_inquiries."id";

ALTER TABLE "college_fee_inquiries"
ALTER COLUMN "trackingNumber" SET DEFAULT nextval('"college_fee_inquiry_tracking_number_seq"'),
ALTER COLUMN "trackingNumber" SET NOT NULL,
ALTER COLUMN "trackingId" SET NOT NULL;

CREATE UNIQUE INDEX "college_fee_inquiries_trackingNumber_key" ON "college_fee_inquiries"("trackingNumber");
CREATE UNIQUE INDEX "college_fee_inquiries_trackingId_key" ON "college_fee_inquiries"("trackingId");
