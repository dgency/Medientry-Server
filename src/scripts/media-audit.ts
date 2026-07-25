import { access } from 'node:fs/promises';
import path from 'node:path';

import { prisma } from '../config/prisma';
import { uploadsRootDirectory } from '../config/upload';
import { normalizeStoredMediaValue, resolvePublicMediaUrl } from '../utils/media-path';

type AuditStatus =
  | 'empty'
  | 'legacy-relative'
  | 'database-relative'
  | 'frontend-relative'
  | 'absolute-url'
  | 'invalid-local-path'
  | 'temporary-browser-url'
  | 'unrecognized';

type AuditRecord = {
  table: string;
  id: string;
  field: string;
  status: AuditStatus;
  value: string | null;
  normalizedValue: string | null;
  existsLocally: boolean | null;
};

const inspectLocalUploadPresence = async (value?: string | null) => {
  const normalizedValue = normalizeStoredMediaValue(value);

  if (!normalizedValue?.startsWith('/uploads/')) {
    return null;
  }

  const relativePath = normalizedValue.replace(/^\/uploads\//, '');
  const absolutePath = path.resolve(uploadsRootDirectory, relativePath);

  try {
    await access(absolutePath);
    return true;
  } catch {
    return false;
  }
};

const classifyValue = (value?: string | null): AuditStatus => {
  if (typeof value !== 'string' || !value.trim()) {
    return 'empty';
  }

  const trimmedValue = value.trim();

  if (/^blob:/i.test(trimmedValue) || /^data:/i.test(trimmedValue)) {
    return 'temporary-browser-url';
  }

  if (/^(?:[a-z]:[\\/]|\\\\)/i.test(trimmedValue)) {
    return 'invalid-local-path';
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    return 'absolute-url';
  }

  if (/^\/?api\/media\//i.test(trimmedValue) || /^\/?media\//i.test(trimmedValue)) {
    return 'database-relative';
  }

  if (/^\/?uploads\//i.test(trimmedValue)) {
    return 'legacy-relative';
  }

  if (
    /^\/?(?:images|icons|home-page-icons|notices)\//i.test(trimmedValue)
    || /^\/?favicon/i.test(trimmedValue)
  ) {
    return 'frontend-relative';
  }

  return 'unrecognized';
};

const auditScalarField = async ({
  table,
  id,
  field,
  value,
}: {
  table: string;
  id: string;
  field: string;
  value?: string | null;
}): Promise<AuditRecord> => ({
  table,
  id,
  field,
  status: classifyValue(value),
  value: typeof value === 'string' ? value : null,
  normalizedValue: resolvePublicMediaUrl(value),
  existsLocally: await inspectLocalUploadPresence(value),
});

const collectAuditRows = async () => {
  const [
    mediaAssets,
    pages,
    blogs,
    studyDestinations,
    medicalColleges,
    notices,
    successStories,
    galleryItems,
    siteSettings,
  ] = await Promise.all([
    prisma.mediaAsset.findMany({
      select: { id: true, url: true, publicUrl: true, path: true, storageKey: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.page.findMany({
      select: { id: true, heroImage: true, ogImage: true },
    }),
    prisma.blog.findMany({
      select: { id: true, featuredImage: true, ogImage: true },
    }),
    prisma.studyDestination.findMany({
      select: { id: true, featuredImage: true, ogImage: true },
    }),
    prisma.medicalCollege.findMany({
      select: { id: true, featuredImage: true, ogImage: true },
    }),
    prisma.notice.findMany({
      select: { id: true, fileUrl: true, ogImage: true },
    }),
    prisma.successStory.findMany({
      select: { id: true, image: true },
    }),
    prisma.galleryItem.findMany({
      select: { id: true, url: true, thumbnail: true },
    }),
    prisma.siteSetting.findMany({
      select: { id: true, logoLight: true, logoDark: true, favicon: true },
      take: 1,
    }),
  ]);

  const tasks: Array<Promise<AuditRecord>> = [];

  for (const item of mediaAssets) {
    tasks.push(auditScalarField({ table: 'media_assets', id: item.id, field: 'url', value: item.url }));
    tasks.push(auditScalarField({ table: 'media_assets', id: item.id, field: 'publicUrl', value: item.publicUrl }));
    tasks.push(auditScalarField({ table: 'media_assets', id: item.id, field: 'path', value: item.path }));
    tasks.push(auditScalarField({ table: 'media_assets', id: item.id, field: 'storageKey', value: item.storageKey }));
  }

  for (const item of pages) {
    tasks.push(auditScalarField({ table: 'pages', id: item.id, field: 'heroImage', value: item.heroImage }));
    tasks.push(auditScalarField({ table: 'pages', id: item.id, field: 'ogImage', value: item.ogImage }));
  }

  for (const item of blogs) {
    tasks.push(auditScalarField({ table: 'blogs', id: item.id, field: 'featuredImage', value: item.featuredImage }));
    tasks.push(auditScalarField({ table: 'blogs', id: item.id, field: 'ogImage', value: item.ogImage }));
  }

  for (const item of studyDestinations) {
    tasks.push(auditScalarField({ table: 'study_destinations', id: item.id, field: 'featuredImage', value: item.featuredImage }));
    tasks.push(auditScalarField({ table: 'study_destinations', id: item.id, field: 'ogImage', value: item.ogImage }));
  }

  for (const item of medicalColleges) {
    tasks.push(auditScalarField({ table: 'medical_colleges', id: item.id, field: 'featuredImage', value: item.featuredImage }));
    tasks.push(auditScalarField({ table: 'medical_colleges', id: item.id, field: 'ogImage', value: item.ogImage }));
  }

  for (const item of notices) {
    tasks.push(auditScalarField({ table: 'notices', id: item.id, field: 'fileUrl', value: item.fileUrl }));
    tasks.push(auditScalarField({ table: 'notices', id: item.id, field: 'ogImage', value: item.ogImage }));
  }

  for (const item of successStories) {
    tasks.push(auditScalarField({ table: 'success_stories', id: item.id, field: 'image', value: item.image }));
  }

  for (const item of galleryItems) {
    tasks.push(auditScalarField({ table: 'gallery_items', id: item.id, field: 'url', value: item.url }));
    tasks.push(auditScalarField({ table: 'gallery_items', id: item.id, field: 'thumbnail', value: item.thumbnail }));
  }

  for (const item of siteSettings) {
    tasks.push(auditScalarField({ table: 'site_settings', id: item.id, field: 'logoLight', value: item.logoLight }));
    tasks.push(auditScalarField({ table: 'site_settings', id: item.id, field: 'logoDark', value: item.logoDark }));
    tasks.push(auditScalarField({ table: 'site_settings', id: item.id, field: 'favicon', value: item.favicon }));
  }

  return Promise.all(tasks);
};

const summarizeRecords = (records: AuditRecord[]) => {
  const summary = new Map<string, number>();

  for (const record of records) {
    summary.set(record.status, (summary.get(record.status) ?? 0) + 1);
  }

  return Object.fromEntries(
    Array.from(summary.entries()).sort(([left], [right]) => left.localeCompare(right)),
  );
};

const main = async () => {
  const records = await collectAuditRows();
  const summary = summarizeRecords(records);
  const missingLocalUploadFiles = records.filter((record) => record.existsLocally === false);
  const actionableRecords = records.filter((record) =>
    ['legacy-relative', 'invalid-local-path', 'temporary-browser-url', 'unrecognized'].includes(
      record.status,
    ),
  );

  console.log(
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        uploadsRootDirectory,
        totalRecords: records.length,
        summary,
        missingLocalUploadFiles: missingLocalUploadFiles.slice(0, 50),
        actionableRecords: actionableRecords.slice(0, 100),
      },
      null,
      2,
    ),
  );
};

main()
  .catch((error) => {
    console.error('[media:audit] Failed to audit media records.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
