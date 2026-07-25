import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';

import { MediaKind, SimpleStatus } from '@prisma/client';

import { prisma } from '../config/prisma';
import { uploadsRootDirectory } from '../config/upload';
import { buildDatabaseStorageKey, buildMediaAssetPublicUrl } from '../services/storage.service';
import {
  getLegacyUploadReference,
  resolveLegacyUploadAbsolutePath,
  type LegacyUploadReference,
} from '../utils/media-migration';
import { sanitizeMediaFilename } from '../utils/media-public-url';

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

type GenericCandidate = {
  type: 'field';
  table: Exclude<SupportedTable, 'media_assets'>;
  id: string;
  field: string;
  currentValue: string;
  reference: LegacyUploadReference;
  applyFieldUpdate: (nextValue: string) => Promise<void>;
};

type MediaAssetCandidate = {
  type: 'media-asset';
  table: 'media_assets';
  id: string;
  currentValue: string;
  filename: string;
  originalName: string | null;
  mimeType: string | null;
  extension: string | null;
  reference: LegacyUploadReference;
};

type MigrationCandidate = GenericCandidate | MediaAssetCandidate;

type MigrationStatus =
  | 'ready'
  | 'migrated'
  | 'deduplicated'
  | 'already-database-backed'
  | 'missing-physical-file'
  | 'unsupported-file'
  | 'failed';

type MigrationReportItem = {
  type: MigrationCandidate['type'];
  table: SupportedTable;
  id: string;
  field: string | null;
  category: string;
  currentValue: string;
  normalizedPath: string;
  sourceAbsolutePath: string;
  checksumSha256: string | null;
  nextPublicUrl: string | null;
  status: MigrationStatus;
  notes: string[];
};

const usage = `
Usage:
  npm run media:migrate-to-database -- --dry-run
  npm run media:migrate-to-database -- --apply
  npm run media:migrate-to-database -- --dry-run --limit=25 --model=media_assets,pages --category=images
`;

const extensionToMimeType: Record<string, string> = {
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

const normalizeFilterSet = (values: string[] | null) =>
  values ? new Set(values.map((value) => value.trim().toLowerCase())) : null;

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

const calculateChecksum = (buffer: Buffer) => createHash('sha256').update(buffer).digest('hex');

const resolveMimeTypeFromPath = (absolutePath: string) =>
  extensionToMimeType[path.extname(absolutePath).toLowerCase()] ?? null;

const resolveMediaKindFromMimeType = (mimeType: string) => {
  if (mimeType === 'application/pdf') {
    return MediaKind.DOCUMENT;
  }

  if (mimeType === 'image/svg+xml') {
    return MediaKind.SVG;
  }

  return MediaKind.IMAGE;
};

const buildStoredFilename = (sourceAbsolutePath: string, mediaId: string) => {
  const extension = path.extname(sourceAbsolutePath).toLowerCase();
  const safeBaseName = sanitizeMediaFilename(path.parse(sourceAbsolutePath).name || 'file');
  return `${safeBaseName}-${mediaId.slice(0, 8)}${extension}`;
};

const writeReportFile = async (reportPath: string, report: unknown) => {
  const absoluteReportPath = path.isAbsolute(reportPath)
    ? reportPath
    : path.resolve(process.cwd(), reportPath);

  await mkdir(path.dirname(absoluteReportPath), { recursive: true });
  await writeFile(absoluteReportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return absoluteReportPath;
};

const collectGenericFieldCandidates = async <TRecord extends { id: string }>(options: {
  table: Exclude<SupportedTable, 'media_assets'>;
  rows: TRecord[];
  fields: Array<keyof TRecord & string>;
  updateField: (id: string, field: keyof TRecord & string, value: string) => Promise<void>;
}) => {
  const candidates: GenericCandidate[] = [];

  for (const row of options.rows) {
    for (const field of options.fields) {
      const rawValue = row[field];

      if (typeof rawValue !== 'string' || !rawValue.trim()) {
        continue;
      }

      const reference = getLegacyUploadReference(rawValue);

      if (!reference) {
        continue;
      }

      candidates.push({
        type: 'field',
        table: options.table,
        id: row.id,
        field,
        currentValue: rawValue,
        reference,
        applyFieldUpdate: async (nextValue) => {
          await options.updateField(row.id, field, nextValue);
        },
      });
    }
  }

  return candidates;
};

const collectMediaAssetCandidates = async () => {
  const rows = await prisma.mediaAsset.findMany({
    select: {
      id: true,
      filename: true,
      originalName: true,
      mimeType: true,
      extension: true,
      path: true,
      publicUrl: true,
      storageKey: true,
      storageType: true,
      url: true,
      blob: {
        select: {
          mediaId: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const candidates: MediaAssetCandidate[] = [];

  for (const row of rows) {
    const reference =
      getLegacyUploadReference(row.storageKey)
      ?? getLegacyUploadReference(row.path)
      ?? getLegacyUploadReference(row.publicUrl)
      ?? getLegacyUploadReference(row.url);

    if (!reference) {
      continue;
    }

    if (row.storageType === 'database' && row.blob) {
      continue;
    }

    candidates.push({
      type: 'media-asset',
      table: 'media_assets',
      id: row.id,
      currentValue:
        row.storageKey?.trim()
        || row.path?.trim()
        || row.publicUrl?.trim()
        || row.url?.trim()
        || reference.normalizedPath,
      filename: row.filename,
      originalName: row.originalName,
      mimeType: row.mimeType,
      extension: row.extension,
      reference,
    });
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

const ensureDatabaseMediaAsset = async ({
  checksumSha256,
  mimeType,
  sourceAbsolutePath,
  sourceBuffer,
}: {
  checksumSha256: string;
  mimeType: string;
  sourceAbsolutePath: string;
  sourceBuffer: Buffer;
}) => {
  const existingAsset = await prisma.mediaAsset.findFirst({
    where: {
      storageType: 'database',
      sha256: checksumSha256,
      blob: {
        isNot: null,
      },
    },
    select: {
      id: true,
      filename: true,
      publicUrl: true,
      storageKey: true,
      storageType: true,
      url: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  if (existingAsset) {
    return {
      created: false,
      deduplicated: true,
      mediaId: existingAsset.id,
      publicUrl: buildMediaAssetPublicUrl(existingAsset) ?? existingAsset.publicUrl ?? existingAsset.url ?? null,
    };
  }

  const mediaId = randomUUID();
  const filename = buildStoredFilename(sourceAbsolutePath, mediaId);
  const publicUrl = buildMediaAssetPublicUrl({
    id: mediaId,
    filename,
    publicUrl: null,
    storageKey: buildDatabaseStorageKey(mediaId, filename),
    storageType: 'database',
    url: null,
  });

  if (!publicUrl) {
    throw new Error('Failed to build the public media URL.');
  }

  const extension = path.extname(sourceAbsolutePath).toLowerCase();

  await prisma.mediaAsset.create({
    data: {
      id: mediaId,
      title: path.parse(sourceAbsolutePath).name,
      filename,
      originalName: path.basename(sourceAbsolutePath),
      path: publicUrl,
      url: publicUrl,
      publicUrl,
      storageKey: buildDatabaseStorageKey(mediaId, filename),
      storageType: 'database',
      mimeType,
      extension,
      sha256: checksumSha256,
      fileType: resolveMediaKindFromMimeType(mimeType),
      size: sourceBuffer.length,
      status: SimpleStatus.ACTIVE,
      blob: {
        create: {
          data: new Uint8Array(sourceBuffer),
        },
      },
    },
  });

  return {
    created: true,
    deduplicated: false,
    mediaId,
    publicUrl,
  };
};

const migrateExistingMediaAsset = async ({
  candidate,
  checksumSha256,
  mimeType,
  sourceAbsolutePath,
  sourceBuffer,
}: {
  candidate: MediaAssetCandidate;
  checksumSha256: string;
  mimeType: string;
  sourceAbsolutePath: string;
  sourceBuffer: Buffer;
}) => {
  const filename = candidate.filename?.trim() || buildStoredFilename(sourceAbsolutePath, candidate.id);
  const publicUrl = buildMediaAssetPublicUrl({
    id: candidate.id,
    filename,
    publicUrl: null,
    storageKey: buildDatabaseStorageKey(candidate.id, filename),
    storageType: 'database',
    url: null,
  });

  if (!publicUrl) {
    throw new Error('Failed to build the public media URL.');
  }

  const extension = path.extname(sourceAbsolutePath).toLowerCase();

  await prisma.mediaAsset.update({
    where: { id: candidate.id },
    data: {
      filename,
      originalName: candidate.originalName?.trim() || path.basename(sourceAbsolutePath),
      path: publicUrl,
      url: publicUrl,
      publicUrl,
      storageKey: buildDatabaseStorageKey(candidate.id, filename),
      storageType: 'database',
      mimeType,
      extension,
      sha256: checksumSha256,
      fileType: resolveMediaKindFromMimeType(mimeType),
      size: sourceBuffer.length,
      status: SimpleStatus.ACTIVE,
      blob: {
        upsert: {
          create: {
            data: new Uint8Array(sourceBuffer),
          },
          update: {
            data: new Uint8Array(sourceBuffer),
          },
        },
      },
    },
  });

  return {
    mediaId: candidate.id,
    publicUrl,
  };
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

    if (categoryFilter && !categoryFilter.has(candidate.reference.category.toLowerCase())) {
      return false;
    }

    return true;
  });

  const limitedCandidates = limit ? filteredCandidates.slice(0, limit) : filteredCandidates;
  const reportItems: MigrationReportItem[] = [];

  for (const candidate of limitedCandidates) {
    const sourceAbsolutePath = resolveLegacyUploadAbsolutePath(uploadsRootDirectory, candidate.reference);

    try {
      await access(sourceAbsolutePath);
    } catch {
      reportItems.push({
        type: candidate.type,
        table: candidate.table,
        id: candidate.id,
        field: candidate.type === 'field' ? candidate.field : null,
        category: candidate.reference.category,
        currentValue: candidate.currentValue,
        normalizedPath: candidate.reference.normalizedPath,
        sourceAbsolutePath,
        checksumSha256: null,
        nextPublicUrl: null,
        status: 'missing-physical-file',
        notes: ['MISSING_PHYSICAL_FILE'],
      });
      continue;
    }

    const sourceBuffer = await readFile(sourceAbsolutePath);
    const checksumSha256 = calculateChecksum(sourceBuffer);
    const mimeType = resolveMimeTypeFromPath(sourceAbsolutePath);

    if (!mimeType) {
      reportItems.push({
        type: candidate.type,
        table: candidate.table,
        id: candidate.id,
        field: candidate.type === 'field' ? candidate.field : null,
        category: candidate.reference.category,
        currentValue: candidate.currentValue,
        normalizedPath: candidate.reference.normalizedPath,
        sourceAbsolutePath,
        checksumSha256,
        nextPublicUrl: null,
        status: 'unsupported-file',
        notes: ['Unsupported legacy file extension.'],
      });
      continue;
    }

    if (!shouldApply) {
      reportItems.push({
        type: candidate.type,
        table: candidate.table,
        id: candidate.id,
        field: candidate.type === 'field' ? candidate.field : null,
        category: candidate.reference.category,
        currentValue: candidate.currentValue,
        normalizedPath: candidate.reference.normalizedPath,
        sourceAbsolutePath,
        checksumSha256,
        nextPublicUrl: candidate.type === 'media-asset'
          ? buildMediaAssetPublicUrl({
            id: candidate.id,
            filename: candidate.filename || buildStoredFilename(sourceAbsolutePath, candidate.id),
            publicUrl: null,
            storageKey: buildDatabaseStorageKey(
              candidate.id,
              candidate.filename || buildStoredFilename(sourceAbsolutePath, candidate.id),
            ),
            storageType: 'database',
            url: null,
          })
          : null,
        status: 'ready',
        notes: [],
      });
      continue;
    }

    try {
      if (candidate.type === 'media-asset') {
        const migratedAsset = await migrateExistingMediaAsset({
          candidate,
          checksumSha256,
          mimeType,
          sourceAbsolutePath,
          sourceBuffer,
        });

        reportItems.push({
          type: candidate.type,
          table: candidate.table,
          id: candidate.id,
          field: null,
          category: candidate.reference.category,
          currentValue: candidate.currentValue,
          normalizedPath: candidate.reference.normalizedPath,
          sourceAbsolutePath,
          checksumSha256,
          nextPublicUrl: migratedAsset.publicUrl,
          status: 'migrated',
          notes: [],
        });
        continue;
      }

      const migratedAsset = await ensureDatabaseMediaAsset({
        checksumSha256,
        mimeType,
        sourceAbsolutePath,
        sourceBuffer,
      });

      if (!migratedAsset.publicUrl) {
        throw new Error('Failed to resolve the migrated asset URL.');
      }

      await candidate.applyFieldUpdate(migratedAsset.publicUrl);

      reportItems.push({
        type: candidate.type,
        table: candidate.table,
        id: candidate.id,
        field: candidate.field,
        category: candidate.reference.category,
        currentValue: candidate.currentValue,
        normalizedPath: candidate.reference.normalizedPath,
        sourceAbsolutePath,
        checksumSha256,
        nextPublicUrl: migratedAsset.publicUrl,
        status: migratedAsset.deduplicated ? 'deduplicated' : 'migrated',
        notes: migratedAsset.deduplicated
          ? ['Existing database media matched by SHA-256 and was reused.']
          : [],
      });
    } catch (error) {
      reportItems.push({
        type: candidate.type,
        table: candidate.table,
        id: candidate.id,
        field: candidate.type === 'field' ? candidate.field : null,
        category: candidate.reference.category,
        currentValue: candidate.currentValue,
        normalizedPath: candidate.reference.normalizedPath,
        sourceAbsolutePath,
        checksumSha256,
        nextPublicUrl: null,
        status: 'failed',
        notes: [error instanceof Error ? error.message : 'Unknown migration error.'],
      });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    mode: shouldApply ? 'apply' : 'dry-run',
    uploadsRootDirectory,
    counts: {
      scannedCandidates: allCandidates.length,
      selectedCandidates: limitedCandidates.length,
      ready: reportItems.filter((item) => item.status === 'ready').length,
      migrated: reportItems.filter((item) => item.status === 'migrated').length,
      deduplicated: reportItems.filter((item) => item.status === 'deduplicated').length,
      missingPhysicalFiles: reportItems.filter((item) => item.status === 'missing-physical-file').length,
      unsupportedFiles: reportItems.filter((item) => item.status === 'unsupported-file').length,
      failed: reportItems.filter((item) => item.status === 'failed').length,
    },
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
    const isMissingMigration =
      typeof error === 'object'
      && error !== null
      && 'code' in error
      && (error.code === 'P2021' || error.code === 'P2022');

    if (isMissingMigration) {
      console.error(
        '[media:migrate-to-database] Database schema is not ready. Run `npm run prisma:migrate` before using the database media migration commands.',
      );
    }

    console.error('[media:migrate-to-database] Migration failed.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
