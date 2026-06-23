-- CreateTable
CREATE TABLE "revoked_access_tokens" (
    "id" UUID NOT NULL,
    "jti" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "revoked_access_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultation_leads" (
    "id" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "userRole" TEXT NOT NULL,
    "whatsappNumber" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "emailAddress" TEXT,
    "passingYear" TEXT NOT NULL,
    "neetScore" TEXT,
    "stateName" TEXT NOT NULL,
    "preferredCollege" TEXT,
    "message" TEXT,
    "sourcePage" TEXT,
    "submissionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultation_leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "revoked_access_tokens_jti_key" ON "revoked_access_tokens"("jti");

-- CreateIndex
CREATE INDEX "revoked_access_tokens_userId_expiresAt_idx" ON "revoked_access_tokens"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "revoked_access_tokens_expiresAt_idx" ON "revoked_access_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "consultation_leads_createdAt_idx" ON "consultation_leads"("createdAt");

-- CreateIndex
CREATE INDEX "consultation_leads_phoneNumber_createdAt_idx" ON "consultation_leads"("phoneNumber", "createdAt");
