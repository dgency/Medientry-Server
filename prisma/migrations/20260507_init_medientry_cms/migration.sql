-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SimpleStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "PageType" AS ENUM ('HOME', 'ABOUT', 'CONTACT', 'STUDY_DESTINATION', 'MEDICAL_COLLEGE', 'BLOG', 'NOTICE', 'SUCCESS_STORY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "PageTemplateType" AS ENUM ('DEFAULT', 'DESTINATION', 'COLLEGE', 'LANDING');

-- CreateEnum
CREATE TYPE "StudyDestinationTemplateType" AS ENUM ('FIXED_FRONTEND_CONTENT', 'DYNAMIC_TEMPLATE');

-- CreateEnum
CREATE TYPE "GalleryItemType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" UUID NOT NULL,
    "logoLight" TEXT,
    "logoDark" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "accentColor" TEXT,
    "textColor" TEXT,
    "favicon" TEXT,
    "contactEmail" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "socialLinks" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "pageType" "PageType" NOT NULL,
    "templateType" "PageTemplateType" NOT NULL DEFAULT 'DEFAULT',
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "heroTitle" TEXT,
    "heroSubtitle" TEXT,
    "heroImage" TEXT,
    "content" JSONB,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ogImage" TEXT,
    "canonicalUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_destinations" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "shortDescription" TEXT,
    "featuredImage" TEXT,
    "content" JSONB,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "showInMenu" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "templateType" "StudyDestinationTemplateType" NOT NULL DEFAULT 'DYNAMIC_TEMPLATE',
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ogImage" TEXT,
    "canonicalUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_colleges" (
    "id" UUID NOT NULL,
    "studyDestinationId" UUID,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT,
    "shortDescription" TEXT,
    "featuredImage" TEXT,
    "gallery" JSONB,
    "tuitionFee" DECIMAL(12,2),
    "hostelFee" DECIMAL(12,2),
    "totalFee" DECIMAL(12,2),
    "ranking" TEXT,
    "eligibility" TEXT,
    "admissionProcess" JSONB,
    "facilities" JSONB,
    "content" JSONB,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ogImage" TEXT,
    "canonicalUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_colleges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_items" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "type" "GalleryItemType" NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail" TEXT,
    "category" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "SimpleStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gallery_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blogs" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "featuredImage" TEXT,
    "content" JSONB,
    "category" TEXT,
    "author" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ogImage" TEXT,
    "canonicalUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notices" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "pinnedOrder" INTEGER,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ogImage" TEXT,
    "canonicalUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "success_stories" (
    "id" UUID NOT NULL,
    "studentName" TEXT NOT NULL,
    "country" TEXT,
    "university" TEXT,
    "image" TEXT,
    "rating" INTEGER,
    "reviewText" TEXT,
    "videoUrl" TEXT,
    "status" "SimpleStatus" NOT NULL DEFAULT 'ACTIVE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "success_stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_section_settings" (
    "id" UUID NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "selectedItemIds" JSONB,
    "itemLimit" INTEGER,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_section_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_status_idx" ON "users"("role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "pages_slug_key" ON "pages"("slug");

-- CreateIndex
CREATE INDEX "pages_pageType_status_idx" ON "pages"("pageType", "status");

-- CreateIndex
CREATE INDEX "pages_status_updatedAt_idx" ON "pages"("status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "study_destinations_slug_key" ON "study_destinations"("slug");

-- CreateIndex
CREATE INDEX "study_destinations_country_status_idx" ON "study_destinations"("country", "status");

-- CreateIndex
CREATE INDEX "study_destinations_isFeatured_sortOrder_idx" ON "study_destinations"("isFeatured", "sortOrder");

-- CreateIndex
CREATE INDEX "study_destinations_showInMenu_sortOrder_idx" ON "study_destinations"("showInMenu", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "medical_colleges_slug_key" ON "medical_colleges"("slug");

-- CreateIndex
CREATE INDEX "medical_colleges_studyDestinationId_idx" ON "medical_colleges"("studyDestinationId");

-- CreateIndex
CREATE INDEX "medical_colleges_country_city_idx" ON "medical_colleges"("country", "city");

-- CreateIndex
CREATE INDEX "medical_colleges_isFeatured_status_idx" ON "medical_colleges"("isFeatured", "status");

-- CreateIndex
CREATE INDEX "gallery_items_type_status_idx" ON "gallery_items"("type", "status");

-- CreateIndex
CREATE INDEX "gallery_items_category_sortOrder_idx" ON "gallery_items"("category", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "blogs_slug_key" ON "blogs"("slug");

-- CreateIndex
CREATE INDEX "blogs_category_status_idx" ON "blogs"("category", "status");

-- CreateIndex
CREATE INDEX "blogs_isPinned_status_createdAt_idx" ON "blogs"("isPinned", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "notices_slug_key" ON "notices"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "notices_pinnedOrder_key" ON "notices"("pinnedOrder");

-- CreateIndex
CREATE INDEX "notices_status_publishedAt_idx" ON "notices"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "notices_isPinned_publishedAt_idx" ON "notices"("isPinned", "publishedAt");

-- CreateIndex
CREATE INDEX "success_stories_status_sortOrder_idx" ON "success_stories"("status", "sortOrder");

-- CreateIndex
CREATE INDEX "success_stories_country_idx" ON "success_stories"("country");

-- CreateIndex
CREATE UNIQUE INDEX "home_section_settings_sectionKey_key" ON "home_section_settings"("sectionKey");

-- AddForeignKey
ALTER TABLE "medical_colleges" ADD CONSTRAINT "medical_colleges_studyDestinationId_fkey" FOREIGN KEY ("studyDestinationId") REFERENCES "study_destinations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Enforce pinned notices to use only two explicit slots.
ALTER TABLE "notices"
ADD CONSTRAINT "notices_pinned_state_check"
CHECK (
  ("isPinned" = false AND "pinnedOrder" IS NULL)
  OR
  ("isPinned" = true AND "pinnedOrder" IN (1, 2))
);

