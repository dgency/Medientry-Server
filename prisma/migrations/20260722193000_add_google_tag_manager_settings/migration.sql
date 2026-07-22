-- CreateEnum
CREATE TYPE "GoogleTagManagerMode" AS ENUM ('CONTAINER_ID', 'CUSTOM_CODE');

-- CreateEnum
CREATE TYPE "GoogleTagManagerEnvironment" AS ENUM ('PRODUCTION', 'ALL');

-- AlterTable
ALTER TABLE "site_settings"
ADD COLUMN "googleTagManagerBodyCode" TEXT,
ADD COLUMN "googleTagManagerEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "googleTagManagerEnvironment" "GoogleTagManagerEnvironment" NOT NULL DEFAULT 'PRODUCTION',
ADD COLUMN "googleTagManagerHeadCode" TEXT,
ADD COLUMN "googleTagManagerId" TEXT,
ADD COLUMN "googleTagManagerMode" "GoogleTagManagerMode" NOT NULL DEFAULT 'CONTAINER_ID';
