CREATE SEQUENCE "consultation_lead_tracking_number_seq";

ALTER TABLE "consultation_leads"
ADD COLUMN "trackingNumber" INTEGER,
ADD COLUMN "trackingId" TEXT;

WITH ordered_leads AS (
  SELECT
    "id",
    nextval('"consultation_lead_tracking_number_seq"')::INTEGER AS tracking_number
  FROM "consultation_leads"
  ORDER BY "createdAt" ASC, "id" ASC
)
UPDATE "consultation_leads" AS lead
SET
  "trackingNumber" = ordered_leads.tracking_number,
  "trackingId" = 'MBD-' || LPAD(ordered_leads.tracking_number::TEXT, 3, '0')
FROM ordered_leads
WHERE lead."id" = ordered_leads."id";

ALTER TABLE "consultation_leads"
ALTER COLUMN "trackingNumber" SET DEFAULT nextval('"consultation_lead_tracking_number_seq"'),
ALTER COLUMN "trackingNumber" SET NOT NULL,
ALTER COLUMN "trackingId" SET NOT NULL;

CREATE UNIQUE INDEX "consultation_leads_trackingNumber_key" ON "consultation_leads"("trackingNumber");
CREATE UNIQUE INDEX "consultation_leads_trackingId_key" ON "consultation_leads"("trackingId");
