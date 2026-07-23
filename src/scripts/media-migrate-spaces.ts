import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { uploadsRootDirectory } from '../config/upload';
import { storageAdapter } from '../services/storage.service';
import {
  getLegacyUploadReference,
  resolveLegacyUploadAbsolutePath,
  type LegacyUploadReference,
} from '../utils/media-migration';

type SupportedTable =
  | 'media_assets'
  | 'pages'
  | 'blogs'
  | 'study_destinations'
  | 'medical_colleges'
  | 'notices'
  | 'success_stories'
  | 'gallery_items'
  | 'site_settings';

type MigrationCandidate = {
  table: SupportedTable;
  id: string;
  field: string;
  currentValue: string;
  normalizedPath: string;
  category: string;
  storageKey: string;
  sourceAbsolutePath: string;
  targetPublicUrl: string | null;
  applyDatabaseUpdate: () => Promise<void>;
  plannedDatabaseUpdate:
    | {
        before: string | null;
        after: string | null;
      }
    | null;
};

type MigrationItemStatus =
  | 'ready'
  | 'already-present-in-spaces'
  | 'migrated'
  | 'db-updated-only'
  | 'missing-source-file'
  | 'skipped-non-spaces-driver'
  | 'failed';

type MigrationReportItem = {
  table: SupportedTable;
  id: string;
  field: string;
  category: string;
  currentValue: string;
  normalizedPath: string;
  storageKey: string;
  targetPublicUrl: string | null;
  sourceAbsolutePath: string;
  checksumSha256: string | null;
  status: MigrationItemStatus;
  notes: string[];
  plannedDatabaseUpdate: MigrationCandidate['plannedDatabaseUpdate'];
};

const usage = `
Usage:
  npm run media:migrate:dry
  npm run media:migrate -- --apply
  npm run media:migrate -- --dry-run --limit=25 --model=media_assets,pages --category=images
`;

const parseListArgument = (name: string) => {
  const rawValue = process.argv.find((argument) => argument.startsWith(`--${name}=`));

  if (!rawValue) {
    return null;
  }

  const [, value = ''] = rawValue.split('=');
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseLimit = () => {
  const rawValue = process.argv.find((argument) => argument.startsWith('--limit='));

  if (!rawValue) {
    return null;
  }

  const [, value = ''] = rawValue.split('=');
  const parsedLimit = Number.parseInt(value, 10);

  if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
    throw new Error(`Invalid --limit value "${value}".`);
  }

  return parsedLimit;
};

const parseReportPath = () => {
  const rawValue = process.argv.find((argument) => argument.startsWith('--report='));

  if (!rawValue) {
    return null;
  }

  const [, value = ''] = rawValue.split('=');
  return value.trim() || null;
};

const normalizeFilterSet = (values: string[] | null) =>
  values ? new Set(values.map((value) => value.trim().toLowerCase())) : null;

const extensionToMimeType: Record<string, string> = {
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

const resolveMimeType = (absolutePath: string) =>
  extensionToMimeType[path.extname(absolutePath).toLowerCase()] ?? 'application/octet-stream';

const calculateChecksum = (buffer: Buffer) => createHash('sha256').update(buffer).digest('hex');

const spacesPublicBaseUrl = (env.SPACES_PUBLIC_BASE_URL ?? '').trim().replace(/\/+$/, '');

const buildTargetPublicUrl = (storageKey: string) => {
  if (spacesPublicBaseUrl) {
    return `${spacesPublicBaseUrl}/${storageKey}`;
  }

  if (storageAdapter.driver === 'spaces') {
    return storageAdapter.getPublicUrl(storageKey);
  }

  return null;
};

const isSpacesUrl = (value?: string | null) =>
  Boolean(
    spacesPublicBaseUrl
    && typeof value === 'string'
    && value.trim().toLowerCase().startsWith(spacesPublicBaseUrl.toLowerCase()),
  );

const buildLegacyCandidate = ({
  table,
  id,
  field,
  value,
  reference,
  applyDatabaseUpdate,
  plannedDatabaseUpdate,
}: {
  table: SupportedTable;
  id: string;
  field: string;
  value: string;
  reference: LegacyUploadReference;
  applyDatabaseUpdate: () => Promise<void>;
  plannedDatabaseUpdate: MigrationCandidate['plannedDatabaseUpdate'];
}): MigrationCandidate => ({
  table,
  id,
  field,
  currentValue: value,
  normalizedPath: reference.normalizedPath,
  category: reference.category,
  storageKey: reference.storageKey,
  sourceAbsolutePath: resolveLegacyUploadAbsolutePath(uploadsRootDirectory, reference),
  targetPublicUrl: buildTargetPublicUrl(reference.storageKey),
  applyDatabaseUpdate,
  plannedDatabaseUpdate,
});

const collectGenericFieldCandidates = async <TRecord extends { id: string }>(options: {
  table: SupportedTable;
  rows: TRecord[];
  fields: Array<keyof TRecord & string>;
  updateField: (id: string, field: keyof TRecord & string, value: string) => Promise<void>;
}) => {
  const candidates: MigrationCandidate[] = [];

  for (const row of options.rows) {
    for (const field of options.fields) {
      const rawValue = row[field];

      if (typeof rawValue !== 'string' || !rawValue.trim() || isSpacesUrl(rawValue)) {
        continue;
      }

      const reference = getLegacyUploadReference(rawValue);

      if (!reference) {
        continue;
      }

      const shouldUpdateField = rawValue.trim() !== reference.normalizedPath;

      candidates.push(
        buildLegacyCandidate({
          table: options.table,
          id: row.id,
          field,
          value: rawValue,
          reference,
          applyDatabaseUpdate: async () => {
            if (!shouldUpdateField) {
              return;
            }

            await options.updateField(row.id, field, reference.normalizedPath);
          },
          plannedDatabaseUpdate: shouldUpdateField
            ? {
                before: rawValue,
                after: reference.normalizedPath,
              }
            : null,
        }),
      );
    }
  }

  return candidates;
};

const collectMediaAssetCandidates = async () => {
  const rows = await prisma.mediaAsset.findMany({
    select: {
      id: true,
      path: true,
      publicUrl: true,
      storageKey: true,
      url: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const candidates: MigrationCandidate[] = [];

  for (const row of rows) {
    const reference =
      getLegacyUploadReference(row.storageKey)
      ?? getLegacyUploadReference(row.path)
      ?? getLegacyUploadReference(row.publicUrl)
      ?? getLegacyUploadReference(row.url);

    if (!reference) {
      continue;
    }

    const targetPublicUrl = buildTargetPublicUrl(reference.storageKey);
    const nextPathValue = reference.storageKey;
    const nextPublicUrlValue = targetPublicUrl ?? row.publicUrl ?? row.url ?? reference.normalizedPath;
    const nextUrlValue = targetPublicUrl ?? row.url ?? row.publicUrl ?? reference.normalizedPath;
    const needsUpdate =
      row.storageKey !== reference.storageKey
      || row.path !== nextPathValue
      || row.publicUrl !== nextPublicUrlValue
      || row.url !== nextUrlValue;

    candidates.push(
      buildLegacyCandidate({
        table: 'media_assets',
        id: row.id,
        field: 'storageKey',
        value:
          row.storageKey?.trim()
          || row.path?.trim()
          || row.publicUrl?.trim()
          || row.url?.trim()
          || reference.normalizedPath,
        reference,
        applyDatabaseUpdate: async () => {
          if (!needsUpdate) {
            return;
          }

          await prisma.mediaAsset.update({
            where: { id: row.id },
            data: {
              storageKey: reference.storageKey,
              path: nextPathValue,
              publicUrl: nextPublicUrlValue,
              url: nextUrlValue,
            },
          });
        },
        plannedDatabaseUpdate: needsUpdate
          ? {
              before: JSON.stringify({
                storageKey: row.storageKey ?? null,
                path: row.path ?? null,
                publicUrl: row.publicUrl ?? null,
                url: row.url ?? null,
              }),
              after: JSON.stringify({
                storageKey: reference.storageKey,
                path: nextPathValue,
                publicUrl: nextPublicUrlValue,
                url: nextUrlValue,
              }),
            }
          : null,
      }),
    );
  }

  return candidates;
};

const collectCandidates = async () => {
  const [mediaAssets, pages, blogs, studyDestinations, medicalColleges, notices, successStories, galleryItems, siteSettings] =
    await Promise.all([
      collectMediaAssetCandidates(),
      collectGenericFieldCandidates({
        table: 'pages',
        rows: await prisma.page.findMany({ select: { id: true, heroImage: true, ogImage: true } }),
        fields: ['heroImage', 'ogImage'],
        updateField: async (id, field, value) => {
          await prisma.page.update({ where: { id }, data: { [field]: value } });
        },
      }),
      collectGenericFieldCandidates({
        table: 'blogs',
        rows: await prisma.blog.findMany({ select: { id: true, featuredImage: true, ogImage: true } }),
        fields: ['featuredImage', 'ogImage'],
        updateField: async (id, field, value) => {
          await prisma.blog.update({ where: { id }, data: { [field]: value } });
        },
      }),
      collectGenericFieldCandidates({
        table: 'study_destinations',
        rows: await prisma.studyDestination.findMany({
          select: { id: true, featuredImage: true, ogImage: true },
        }),
        fields: ['featuredImage', 'ogImage'],
        updateField: async (id, field, value) => {
          await prisma.studyDestination.update({ where: { id }, data: { [field]: value } });
        },
      }),
      collectGenericFieldCandidates({
        table: 'medical_colleges',
        rows: await prisma.medicalCollege.findMany({
          select: { id: true, featuredImage: true, ogImage: true },
        }),
        fields: ['featuredImage', 'ogImage'],
        updateField: async (id, field, value) => {
          await prisma.medicalCollege.update({ where: { id }, data: { [field]: value } });
        },
      }),
      collectGenericFieldCandidates({
        table: 'notices',
        rows: await prisma.notice.findMany({ select: { id: true, fileUrl: true, ogImage: true } }),
        fields: ['fileUrl', 'ogImage'],
        updateField: async (id, field, value) => {
          await prisma.notice.update({ where: { id }, data: { [field]: value } });
        },
      }),
      collectGenericFieldCandidates({
        table: 'success_stories',
        rows: await prisma.successStory.findMany({ select: { id: true, image: true } }),
        fields: ['image'],
        updateField: async (id, field, value) => {
          await prisma.successStory.update({ where: { id }, data: { [field]: value } });
        },
      }),
      collectGenericFieldCandidates({
        table: 'gallery_items',
        rows: await prisma.galleryItem.findMany({ select: { id: true, url: true, thumbnail: true } }),
        fields: ['url', 'thumbnail'],
        updateField: async (id, field, value) => {
          await prisma.galleryItem.update({ where: { id }, data: { [field]: value } });
        },
      }),
      collectGenericFieldCandidates({
        table: 'site_settings',
        rows: await prisma.siteSetting.findMany({
          select: { id: true, logoLight: true, logoDark: true, favicon: true },
        }),
        fields: ['logoLight', 'logoDark', 'favicon'],
        updateField: async (id, field, value) => {
          await prisma.siteSetting.update({ where: { id }, data: { [field]: value } });
        },
      }),
    ]);

  return [
    ...mediaAssets,
    ...pages,
    ...blogs,
    ...studyDestinations,
    ...medicalColleges,
    ...notices,
    ...successStories,
    ...galleryItems,
    ...siteSettings,
  ];
};

const writeReportFile = async (reportPath: string, report: unknown) => {
  const absoluteReportPath = path.isAbsolute(reportPath)
    ? reportPath
    : path.resolve(process.cwd(), reportPath);

  await mkdir(path.dirname(absoluteReportPath), { recursive: true });
  await writeFile(absoluteReportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return absoluteReportPath;
};

const main = async () => {
  if (process.argv.includes('--help')) {
    console.log(usage.trim());
    return;
  }

  const shouldApply = process.argv.includes('--apply') && !process.argv.includes('--dry-run');
  const limit = parseLimit();
  const modelFilter = normalizeFilterSet(parseListArgument('model'));
  const categoryFilter = normalizeFilterSet(parseListArgument('category'));
  const reportPath = parseReportPath();

  const allCandidates = await collectCandidates();
  const filteredCandidates = allCandidates.filter((candidate) => {
    if (modelFilter && !modelFilter.has(candidate.table)) {
      return false;
    }

    if (categoryFilter && !categoryFilter.has(candidate.category.toLowerCase())) {
      return false;
    }

    return true;
  });

  const limitedCandidates = limit ? filteredCandidates.slice(0, limit) : filteredCandidates;
  const processedChecksums = new Map<string, string>();
  const reportItems: MigrationReportItem[] = [];

  if (shouldApply && storageAdapter.driver !== 'spaces') {
    throw new Error('Real migration requires STORAGE_DRIVER=spaces.');
  }

  for (const candidate of limitedCandidates) {
    try {
      await access(candidate.sourceAbsolutePath);
    } catch {
      reportItems.push({
        ...candidate,
        checksumSha256: null,
        status: 'missing-source-file',
        notes: ['Legacy source file was not found in the configured upload directory.'],
      });
      console.warn('[media:migrate] Missing legacy source file.', {
        table: candidate.table,
        id: candidate.id,
        field: candidate.field,
        sourceAbsolutePath: candidate.sourceAbsolutePath,
      });
      continue;
    }

    const fileBuffer = await readFile(candidate.sourceAbsolutePath);
    const checksumSha256 = calculateChecksum(fileBuffer);
    const objectAlreadyExists =
      storageAdapter.driver === 'spaces'
        ? await storageAdapter.exists(candidate.storageKey)
        : false;
    const migrationMapCollision = processedChecksums.get(candidate.storageKey);
    const notes: string[] = [];

    if (migrationMapCollision && migrationMapCollision !== checksumSha256) {
      notes.push('Target storage key was reused by a different checksum in this run.');
    }

    processedChecksums.set(candidate.storageKey, checksumSha256);

    if (!shouldApply) {
      reportItems.push({
        ...candidate,
        checksumSha256,
        status: objectAlreadyExists ? 'already-present-in-spaces' : 'ready',
        notes: objectAlreadyExists
          ? ['Object already exists in Spaces. The migration can still update database fields if needed.']
          : notes,
      });
      continue;
    }

    if (storageAdapter.driver !== 'spaces') {
      reportItems.push({
        ...candidate,
        checksumSha256,
        status: 'skipped-non-spaces-driver',
        notes: ['Real migration was skipped because STORAGE_DRIVER is not set to spaces.'],
      });
      continue;
    }

    let uploadedThisRun = false;

    if (!objectAlreadyExists) {
      console.info('[media:migrate] Upload started.', {
        table: candidate.table,
        id: candidate.id,
        field: candidate.field,
        storageKey: candidate.storageKey,
      });

      await storageAdapter.save({
        buffer: fileBuffer,
        storageKey: candidate.storageKey,
        folder: candidate.category,
        extension: path.extname(candidate.sourceAbsolutePath) || '.bin',
        mimeType: resolveMimeType(candidate.sourceAbsolutePath),
        originalName: path.basename(candidate.sourceAbsolutePath),
      });
      uploadedThisRun = true;

      console.info('[media:migrate] Upload completed.', {
        table: candidate.table,
        id: candidate.id,
        field: candidate.field,
        storageKey: candidate.storageKey,
      });
    }

    try {
      await candidate.applyDatabaseUpdate();

      reportItems.push({
        ...candidate,
        checksumSha256,
        status: uploadedThisRun ? 'migrated' : 'db-updated-only',
        notes: objectAlreadyExists
          ? ['Object already existed in Spaces. Database normalization/update completed.']
          : notes,
      });
    } catch (error) {
      console.error('[media:migrate] Database update failed after upload.', {
        table: candidate.table,
        id: candidate.id,
        field: candidate.field,
        storageKey: candidate.storageKey,
        reason: error instanceof Error ? error.message : 'Unknown database error.',
      });

      reportItems.push({
        ...candidate,
        checksumSha256,
        status: 'failed',
        notes: [
          ...notes,
          uploadedThisRun
            ? 'Object upload succeeded but the database update failed. Review rollback data in this report before retrying.'
            : 'Database update failed while the object was already present in Spaces.',
        ],
      });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    mode: shouldApply ? 'apply' : 'dry-run',
    storageDriver: storageAdapter.driver,
    spacesPublicBaseUrl: spacesPublicBaseUrl || null,
    uploadsRootDirectory,
    filters: {
      limit,
      models: modelFilter ? Array.from(modelFilter) : null,
      categories: categoryFilter ? Array.from(categoryFilter) : null,
    },
    counts: {
      scannedCandidates: allCandidates.length,
      selectedCandidates: limitedCandidates.length,
      ready: reportItems.filter((item) => item.status === 'ready').length,
      alreadyPresentInSpaces: reportItems.filter((item) => item.status === 'already-present-in-spaces').length,
      migrated: reportItems.filter((item) => item.status === 'migrated').length,
      dbUpdatedOnly: reportItems.filter((item) => item.status === 'db-updated-only').length,
      missingSourceFiles: reportItems.filter((item) => item.status === 'missing-source-file').length,
      failed: reportItems.filter((item) => item.status === 'failed').length,
    },
    missingSourceRecords: reportItems.filter((item) => item.status === 'missing-source-file'),
    items: reportItems,
  };

  if (reportPath) {
    const absoluteReportPath = await writeReportFile(reportPath, report);
    console.log(JSON.stringify({ ...report, reportPath: absoluteReportPath }, null, 2));
    return;
  }

  console.log(JSON.stringify(report, null, 2));
};

main()
  .catch((error) => {
    console.error('[media:migrate] Migration failed.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
