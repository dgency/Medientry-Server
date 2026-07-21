-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'SVG', 'VIDEO', 'DOCUMENT', 'UNKNOWN');

-- CreateTable
CREATE TABLE "media_assets" (
    "id" UUID NOT NULL,
    "title" TEXT,
    "altText" TEXT,
    "caption" TEXT,
    "filename" TEXT NOT NULL,
    "originalName" TEXT,
    "path" TEXT,
    "url" TEXT,
    "publicUrl" TEXT,
    "storageKey" TEXT,
    "mimeType" TEXT,
    "extension" TEXT,
    "fileType" "MediaKind" NOT NULL DEFAULT 'UNKNOWN',
    "size" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    "status" "SimpleStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "media_assets_status_createdAt_idx" ON "media_assets"("status", "createdAt");

-- CreateIndex
CREATE INDEX "media_assets_fileType_createdAt_idx" ON "media_assets"("fileType", "createdAt");

-- CreateIndex
CREATE INDEX "media_assets_filename_idx" ON "media_assets"("filename");
