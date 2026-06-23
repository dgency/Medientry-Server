CREATE TABLE "college_fee_inquiries" (
  "id" UUID NOT NULL,
  "medicalCollegeId" UUID,
  "fullName" TEXT NOT NULL,
  "phoneNumber" TEXT NOT NULL,
  "emailAddress" TEXT,
  "country" TEXT,
  "preferredStudyDestination" TEXT,
  "interestedCollegeName" TEXT NOT NULL,
  "message" TEXT,
  "source" TEXT NOT NULL DEFAULT 'College Fee Inquiry',
  "sourcePage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "college_fee_inquiries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "college_fee_inquiries_medicalCollegeId_idx"
  ON "college_fee_inquiries"("medicalCollegeId");

CREATE INDEX "college_fee_inquiries_createdAt_idx"
  ON "college_fee_inquiries"("createdAt");

ALTER TABLE "college_fee_inquiries"
  ADD CONSTRAINT "college_fee_inquiries_medicalCollegeId_fkey"
  FOREIGN KEY ("medicalCollegeId")
  REFERENCES "medical_colleges"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
