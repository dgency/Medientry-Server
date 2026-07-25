ALTER TABLE "media_assets"
  ADD COLUMN IF NOT EXISTS "storageType" TEXT NOT NULL DEFAULT 'filesystem',
  ADD COLUMN IF NOT EXISTS "sha256" TEXT;

CREATE TABLE IF NOT EXISTS "media_blobs" (
  "mediaId" UUID NOT NULL,
  "data" BYTEA NOT NULL,
  CONSTRAINT "media_blobs_pkey" PRIMARY KEY ("mediaId"),
  CONSTRAINT "media_blobs_mediaId_fkey"
    FOREIGN KEY ("mediaId") REFERENCES "media_assets"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "media_assets_storageType_status_createdAt_idx"
  ON "media_assets"("storageType", "status", "createdAt");

CREATE INDEX IF NOT EXISTS "media_assets_sha256_idx"
  ON "media_assets"("sha256");
