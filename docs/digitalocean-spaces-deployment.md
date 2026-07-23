# DigitalOcean Spaces Deployment

## 1. Create The Space

1. In DigitalOcean, create a Space in the same region as the app if possible.
2. Enable the CDN endpoint for the Space.
3. Create an access key with read/write access to that Space only.
4. Keep the bucket name, region, endpoint, CDN URL, access key, and secret key ready.

## 2. Server Environment Variables

Set these variables on the `Medientry-Server` app:

- `STORAGE_DRIVER=spaces`
- `SPACES_REGION=sgp1`
- `SPACES_ENDPOINT=https://sgp1.digitaloceanspaces.com`
- `SPACES_BUCKET=<your-space-name>`
- `SPACES_ACCESS_KEY=<server-only secret>`
- `SPACES_SECRET_KEY=<server-only secret>`
- `SPACES_PUBLIC_BASE_URL=https://<your-cdn-hostname>`
- `SERVER_PUBLIC_URL=https://<your-server-hostname>`
- `CLIENT_URL=https://medientrybd.com`
- `ADMIN_URL=https://<your-admin-hostname>`
- `CORS_ORIGINS=https://medientrybd.com,https://www.medientrybd.com`

Do not expose `SPACES_ACCESS_KEY` or `SPACES_SECRET_KEY` to the client.

## 3. Client Public Variables

Set these variables on the `Medientry-Client` app:

- `NEXT_PUBLIC_API_URL=https://<your-server-hostname>/api`
- `NEXT_PUBLIC_MEDIA_BASE_URL=https://<your-cdn-hostname>`

The public client should use only the public API/media hosts, never secret credentials.

## 4. Spaces CORS And CDN

Recommended Spaces CORS policy:

- Allow `GET`, `HEAD`
- Allow origin `https://medientrybd.com`
- Allow origin `https://www.medientrybd.com`
- Allow headers `*` only if needed by your CDN/browser workflow, otherwise keep them narrow

The current server already serves legacy `/uploads` responses with `Cross-Origin-Resource-Policy: cross-origin`.

## 5. Pre-Migration Audit

Run:

```bash
npm run media:audit
npm run media:migrate:dry -- --report=reports/media-migrate-dry-run.json
```

Review:

- `missingSourceRecords`
- `counts`
- any `failed` or `unrecognized` items

## 6. Normalize Legacy Absolute URLs If Needed

This is optional but useful when old database values still store absolute server URLs:

```bash
npm run media:normalize -- --apply
```

## 7. Perform The Real Migration

Only after dry-run review and after `STORAGE_DRIVER=spaces` is configured:

```bash
npm run media:migrate -- --apply --report=reports/media-migrate-apply.json
```

Useful filters:

```bash
npm run media:migrate -- --dry-run --model=media_assets,pages
npm run media:migrate -- --dry-run --category=images --limit=25
```

## 8. Deploy Order

1. Configure the Spaces environment variables on `Medientry-Server`.
2. Deploy `Medientry-Server`.
3. Verify `GET /api/health` reports storage as healthy.
4. Configure `NEXT_PUBLIC_MEDIA_BASE_URL` on `Medientry-Client` if needed.
5. Deploy `Medientry-Client`.
6. Verify several existing CMS images on the public site.

## 9. Production Verification Checklist

Verify at least these five real image classes after deployment:

1. One homepage CMS image
2. One study destination featured image
3. One medical college featured image
4. One gallery image
5. One media-library uploaded asset preview

Also verify:

- dashboard upload still works
- old migrated `/uploads/...` records render
- `/_next/image` returns `200`
- browser console no longer shows missing-image `404` for migrated assets

## 10. Rollback

If the Spaces rollout must be rolled back:

1. Keep the database unchanged if possible.
2. Set `STORAGE_DRIVER=local` only for local development, not as a production persistence strategy.
3. Revert the deployment to the previous server/client code if necessary.
4. Use the migration report files to identify which records were touched.
5. Do not delete the Space objects automatically during rollback.

## 11. Missing Source File Recovery

If `missingSourceRecords` are reported:

1. Search for the original file in old deployment backups, developer machines, or previous object storage.
2. Re-upload the missing asset manually through the CMS if the original is available.
3. If the original file is permanently lost, update the affected CMS record to a replacement asset instead of leaving a broken reference.
