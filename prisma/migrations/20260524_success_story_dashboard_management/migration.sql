ALTER TABLE "success_stories"
ADD COLUMN "roleType" TEXT NOT NULL DEFAULT 'Student',
ADD COLUMN "city" TEXT,
ADD COLUMN "fullStory" TEXT,
ADD COLUMN "showOnHomepage" BOOLEAN NOT NULL DEFAULT true;

DROP INDEX IF EXISTS "success_stories_status_sortOrder_idx";

CREATE INDEX "success_stories_status_showOnHomepage_sortOrder_idx"
ON "success_stories"("status", "showOnHomepage", "sortOrder");
