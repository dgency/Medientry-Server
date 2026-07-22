ALTER TABLE "gallery_items"
ADD COLUMN IF NOT EXISTS "altText" TEXT,
ADD COLUMN IF NOT EXISTS "seoTitle" TEXT,
ADD COLUMN IF NOT EXISTS "seoDescription" TEXT,
ADD COLUMN IF NOT EXISTS "mediaAssetId" UUID;

ALTER TABLE "media_assets"
ADD COLUMN IF NOT EXISTS "seoTitle" TEXT,
ADD COLUMN IF NOT EXISTS "seoDescription" TEXT;

UPDATE "gallery_items" AS "gallery"
SET "mediaAssetId" = "asset"."id"
FROM "media_assets" AS "asset"
WHERE "gallery"."mediaAssetId" IS NULL
  AND (
    NULLIF(BTRIM("gallery"."url"), '') = COALESCE(NULLIF(BTRIM("asset"."publicUrl"), ''), NULLIF(BTRIM("asset"."url"), ''))
    OR NULLIF(BTRIM("gallery"."thumbnail"), '') = COALESCE(NULLIF(BTRIM("asset"."publicUrl"), ''), NULLIF(BTRIM("asset"."url"), ''))
    OR NULLIF(BTRIM("gallery"."url"), '') = NULLIF(BTRIM("asset"."url"), '')
    OR NULLIF(BTRIM("gallery"."thumbnail"), '') = NULLIF(BTRIM("asset"."url"), '')
  );

UPDATE "gallery_items" AS "gallery"
SET "url" = COALESCE(NULLIF(BTRIM("asset"."publicUrl"), ''), NULLIF(BTRIM("asset"."url"), ''), "gallery"."url")
FROM "media_assets" AS "asset"
WHERE "gallery"."mediaAssetId" = "asset"."id"
  AND NULLIF(BTRIM("gallery"."url"), '') IS NULL
  AND COALESCE(NULLIF(BTRIM("asset"."publicUrl"), ''), NULLIF(BTRIM("asset"."url"), '')) IS NOT NULL;

UPDATE "gallery_items" AS "gallery"
SET "altText" = "asset"."altText"
FROM "media_assets" AS "asset"
WHERE "gallery"."mediaAssetId" = "asset"."id"
  AND NULLIF(BTRIM("gallery"."altText"), '') IS NULL
  AND NULLIF(BTRIM("asset"."altText"), '') IS NOT NULL;

CREATE INDEX IF NOT EXISTS "gallery_items_mediaAssetId_idx"
  ON "gallery_items"("mediaAssetId");

DO $$
BEGIN
  ALTER TABLE "gallery_items"
  ADD CONSTRAINT "gallery_items_mediaAssetId_fkey"
  FOREIGN KEY ("mediaAssetId") REFERENCES "media_assets"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
