# App Platform Database Media

## Overview

This deployment keeps both applications on DigitalOcean App Platform while moving persistent uploaded media into PostgreSQL.

- New production uploads must use `STORAGE_DRIVER=database`.
- Legacy `/uploads/...` files can remain readable during migration with `MEDIA_ENABLE_LEGACY_FILESYSTEM_FALLBACK=true`.
- App Platform local disk is not the production source of truth.

## Prerequisites

1. A persistent PostgreSQL database reachable from the server.
2. The Prisma migration `20260725140000_add_database_media_blobs`.
3. Server environment variables:
   - `NODE_ENV=production`
   - `DATABASE_URL=...`
   - `STORAGE_DRIVER=database`
   - `SERVER_PUBLIC_URL=https://coral-app-6h7q9.ondigitalocean.app`
   - `CLIENT_URL=https://medientry-client-a2oeb.ondigitalocean.app`
   - `ADMIN_URL=...`
   - `MEDIA_MAX_IMAGE_BYTES=10485760`
   - `MEDIA_MAX_DOCUMENT_BYTES=10485760`
   - `MEDIA_MAX_VIDEO_BYTES=26214400`
   - `MEDIA_CACHE_MAX_AGE=31536000`
   - `MEDIA_ENABLE_LEGACY_FILESYSTEM_FALLBACK=true`
4. Client environment variable:
   - `NEXT_PUBLIC_API_URL=https://coral-app-6h7q9.ondigitalocean.app`

`NEXT_PUBLIC_API_URL` must exist before the Next.js client build starts.

## Deployment Order

1. Deploy the server first.
2. Run `npm run prisma:migrate`.
3. Check `GET /api/health`.
4. Confirm the storage block reports:
   - `"driver": "database"`
   - `"persistent": true`
   - `"status": "up"`
5. Run `npm run media:migrate-to-database -- --dry-run`.
6. Review any `MISSING_PHYSICAL_FILE` entries.
7. Run `npm run media:migrate-to-database -- --apply` when the dry run looks correct.
8. Run `npm run media:verify-database`.
9. Deploy the client.

## Verification Checklist

1. Upload one new image in the dashboard.
2. Confirm the response contains `/api/media/<id>/<filename>`.
3. Open that media URL directly and confirm HTTP 200 with the expected content type.
4. Load the same image through the client and confirm Next.js `/_next/image` returns 200.
5. Replace the image and confirm the new upload gets a new media ID and URL.
6. Redeploy the server and confirm the image still loads.
7. Redeploy the client and confirm the image still loads.
8. Confirm media-library list responses do not include blob data.
9. Run `npm run media:audit-orphans`.

## Legacy Migration Notes

- The migration command never deletes source files automatically.
- Legacy files missing from `/uploads` are reported as `MISSING_PHYSICAL_FILE`.
- Those missing files must be re-uploaded manually.
- Leave `MEDIA_ENABLE_LEGACY_FILESYSTEM_FALLBACK=true` until legacy URLs have been migrated or intentionally retired.

## Monitoring And Backups

- PostgreSQL size will grow as images and PDF files move into `media_blobs`.
- Database backups must cover both `media_assets` and `media_blobs`.
- Run `npm run media:verify-database` after major imports.
- Run `npm run media:audit-orphans` before any manual cleanup plan.
