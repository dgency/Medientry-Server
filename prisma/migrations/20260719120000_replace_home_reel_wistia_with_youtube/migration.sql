ALTER TABLE "home_reels"
ADD COLUMN "videoUrl" TEXT,
ADD COLUMN "youtubeVideoId" TEXT;

ALTER TABLE "home_reels"
DROP COLUMN "wistiaVideoId",
DROP COLUMN "wistiaEmbedCode";
