-- AlterTable
ALTER TABLE "home_section_settings" ADD COLUMN     "eyebrow" TEXT;

-- AlterTable
ALTER TABLE "pages" ALTER COLUMN "pageType" SET DEFAULT 'CUSTOM';

-- CreateTable
CREATE TABLE "home_reels" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "thumbnail" TEXT,
    "wistiaVideoId" TEXT,
    "wistiaEmbedCode" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "SimpleStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_reels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "home_reels_status_sortOrder_idx" ON "home_reels"("status", "sortOrder");
