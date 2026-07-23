import { MediaKind, Prisma, SimpleStatus } from '@prisma/client';

import { prisma } from '../config/prisma';
import { ApiError } from '../utils/api-error';
import {
  buildPaginatedResult,
  type PaginatedResult,
  type PaginationInput,
} from '../utils/pagination';
import {
  publicMediaAssetSelect,
  serializeMediaAsset,
} from '../utils/media-asset-response';
import { storageAdapter } from './storage.service';

type ListMediaAssetsInput = {
  fileType?: MediaKind | 'ALL';
  status?: SimpleStatus | 'ALL';
  search?: string;
  pagination?: PaginationInput | null;
};

type UpdateMediaAssetInput = {
  title?: string | null;
  altText?: string | null;
  caption?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  status?: SimpleStatus;
};

type DeleteMediaAssetsResult = {
  deletedIds: string[];
  deletedCount: number;
};

export type MediaAssetUsageReference = {
  key: string;
  label: string;
  count: number;
  examples: string[];
};

export type MediaAssetUsageSummary = {
  assetId: string;
  isReferenced: boolean;
  totalReferences: number;
  references: MediaAssetUsageReference[];
};

const normalizeNullableString = (value?: string | null) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

const buildUniqueStrings = (values: Array<string | null | undefined>) =>
  Array.from(
    new Set(
      values
        .map((value) => normalizeNullableString(value))
        .filter((value): value is string => Boolean(value)),
    ),
  );

const buildSearchFragments = (asset: {
  publicUrl?: string | null;
  url?: string | null;
  path?: string | null;
  storageKey?: string | null;
}) =>
  buildUniqueStrings([asset.publicUrl, asset.url, asset.path, asset.storageKey]).sort(
    (left, right) => right.length - left.length,
  );

const buildTextContainsClause = (columns: string[], fragments: string[]) => {
  const clauses: Prisma.Sql[] = [];

  for (const column of columns) {
    const columnSql = Prisma.raw(`COALESCE(CAST("${column}" AS TEXT), '')`);

    for (const fragment of fragments) {
      clauses.push(
        Prisma.sql`${columnSql} ILIKE ${`%${fragment}%`}`,
      );
    }
  }

  if (clauses.length === 0) {
    return null;
  }

  return Prisma.sql`(${Prisma.join(clauses, ' OR ')})`;
};

const toUsageExamples = (labels: Array<string | null | undefined>) =>
  Array.from(
    new Set(
      labels
        .map((label) => normalizeNullableString(label))
        .filter((label): label is string => Boolean(label)),
    ),
  );

const queryUsageRows = async ({
  tableName,
  columns,
  labelExpression,
  orderByExpression,
  fragments,
}: {
  tableName: string;
  columns: string[];
  labelExpression: string;
  orderByExpression: string;
  fragments: string[];
}) => {
  const whereClause = buildTextContainsClause(columns, fragments);

  if (!whereClause) {
    return {
      count: 0,
      examples: [] as string[],
    };
  }

  const rows = await prisma.$queryRaw<Array<{ label: string | null; totalCount: number }>>(
    Prisma.sql`
      SELECT
        ${Prisma.raw(labelExpression)} AS "label",
        COUNT(*) OVER()::int AS "totalCount"
      FROM ${Prisma.raw(`"${tableName}"`)}
      WHERE ${whereClause}
      ORDER BY ${Prisma.raw(orderByExpression)}
      LIMIT 3
    `,
  );

  return {
    count: rows[0]?.totalCount ?? 0,
    examples: toUsageExamples(rows.map((row) => row.label)),
  };
};

const buildUsageReference = (
  key: string,
  label: string,
  count: number,
  examples: string[],
): MediaAssetUsageReference | null => {
  if (count <= 0) {
    return null;
  }

  return {
    key,
    label,
    count,
    examples,
  };
};

const getMediaAssetUsageSummary = async (asset: {
  id: string;
  publicUrl: string | null;
  url: string | null;
  path: string | null;
  storageKey: string | null;
}) => {
  const fragments = buildSearchFragments(asset);

  const [
    siteSettingsUsage,
    pagesUsage,
    studyDestinationsUsage,
    medicalCollegesUsage,
    blogsUsage,
    noticesUsage,
    successStoriesUsage,
    homeReelsUsage,
    homeSectionsUsage,
    galleryUsage,
  ] = await Promise.all([
    queryUsageRows({
      tableName: 'site_settings',
      columns: ['logoLight', 'logoDark', 'favicon'],
      labelExpression: `'Global site settings'`,
      orderByExpression: `"updatedAt" DESC`,
      fragments,
    }),
    queryUsageRows({
      tableName: 'pages',
      columns: ['heroImage', 'ogImage', 'content'],
      labelExpression: `COALESCE(NULLIF(TRIM("title"), ''), NULLIF(TRIM("slug"), ''), "id")`,
      orderByExpression: `"updatedAt" DESC, "title" ASC`,
      fragments,
    }),
    queryUsageRows({
      tableName: 'study_destinations',
      columns: ['featuredImage', 'ogImage', 'content'],
      labelExpression: `COALESCE(NULLIF(TRIM("title"), ''), NULLIF(TRIM("slug"), ''), "id")`,
      orderByExpression: `"updatedAt" DESC, "title" ASC`,
      fragments,
    }),
    queryUsageRows({
      tableName: 'medical_colleges',
      columns: ['featuredImage', 'ogImage', 'gallery', 'content'],
      labelExpression: `COALESCE(NULLIF(TRIM("name"), ''), NULLIF(TRIM("slug"), ''), "id")`,
      orderByExpression: `"updatedAt" DESC, "name" ASC`,
      fragments,
    }),
    queryUsageRows({
      tableName: 'blogs',
      columns: ['featuredImage', 'ogImage', 'content'],
      labelExpression: `COALESCE(NULLIF(TRIM("title"), ''), NULLIF(TRIM("slug"), ''), "id")`,
      orderByExpression: `"updatedAt" DESC, "title" ASC`,
      fragments,
    }),
    queryUsageRows({
      tableName: 'notices',
      columns: ['fileUrl', 'ogImage', 'description'],
      labelExpression: `COALESCE(NULLIF(TRIM("title"), ''), NULLIF(TRIM("slug"), ''), "id")`,
      orderByExpression: `"updatedAt" DESC, "title" ASC`,
      fragments,
    }),
    queryUsageRows({
      tableName: 'success_stories',
      columns: ['image'],
      labelExpression: `COALESCE(NULLIF(TRIM("studentName"), ''), NULLIF(TRIM("university"), ''), "id")`,
      orderByExpression: `"updatedAt" DESC, "studentName" ASC`,
      fragments,
    }),
    queryUsageRows({
      tableName: 'home_reels',
      columns: ['thumbnail'],
      labelExpression: `COALESCE(NULLIF(TRIM("title"), ''), "id")`,
      orderByExpression: `"updatedAt" DESC, "title" ASC`,
      fragments,
    }),
    queryUsageRows({
      tableName: 'home_section_settings',
      columns: ['content'],
      labelExpression: `COALESCE(NULLIF(TRIM("sectionKey"), ''), "id")`,
      orderByExpression: `"updatedAt" DESC, "sectionKey" ASC`,
      fragments,
    }),
    (async () => {
      const stringMatchClause = buildTextContainsClause(['url', 'thumbnail'], fragments);
      const rows = await prisma.$queryRaw<Array<{ label: string | null; totalCount: number }>>(
        Prisma.sql`
          SELECT
            COALESCE(NULLIF(TRIM("title"), ''), "id") AS "label",
            COUNT(*) OVER()::int AS "totalCount"
          FROM "gallery_items"
          WHERE "mediaAssetId" = ${asset.id}
            ${stringMatchClause ? Prisma.sql`OR ${stringMatchClause}` : Prisma.sql``}
          ORDER BY "updatedAt" DESC, "title" ASC
          LIMIT 3
        `,
      );

      return {
        count: rows[0]?.totalCount ?? 0,
        examples: toUsageExamples(rows.map((row) => row.label)),
      };
    })(),
  ]);

  const references = [
    buildUsageReference('site-settings', 'Site Settings', siteSettingsUsage.count, siteSettingsUsage.examples),
    buildUsageReference('pages', 'Pages', pagesUsage.count, pagesUsage.examples),
    buildUsageReference(
      'study-destinations',
      'Study Destinations',
      studyDestinationsUsage.count,
      studyDestinationsUsage.examples,
    ),
    buildUsageReference(
      'medical-colleges',
      'Medical Colleges',
      medicalCollegesUsage.count,
      medicalCollegesUsage.examples,
    ),
    buildUsageReference('blogs', 'Knowledge Hub / Blogs', blogsUsage.count, blogsUsage.examples),
    buildUsageReference('notices', 'Notices & Downloads', noticesUsage.count, noticesUsage.examples),
    buildUsageReference(
      'success-stories',
      'Success Stories',
      successStoriesUsage.count,
      successStoriesUsage.examples,
    ),
    buildUsageReference('home-reels', 'Home Reels', homeReelsUsage.count, homeReelsUsage.examples),
    buildUsageReference('home-sections', 'Home Sections', homeSectionsUsage.count, homeSectionsUsage.examples),
    buildUsageReference('gallery', 'Gallery', galleryUsage.count, galleryUsage.examples),
  ].filter((reference): reference is MediaAssetUsageReference => Boolean(reference));

  const totalReferences = references.reduce(
    (runningTotal, reference) => runningTotal + reference.count,
    0,
  );

  return {
    assetId: asset.id,
    isReferenced: totalReferences > 0,
    totalReferences,
    references,
  } satisfies MediaAssetUsageSummary;
};

export const listMediaAssets = async ({
  fileType,
  status,
  search,
  pagination,
}: ListMediaAssetsInput = {}) => {
  const normalizedSearch = normalizeNullableString(search);
  const where: Prisma.MediaAssetWhereInput = {};

  if (fileType && fileType !== 'ALL') {
    where.fileType = fileType;
  }

  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (normalizedSearch) {
    where.OR = [
      { title: { contains: normalizedSearch, mode: 'insensitive' } },
      { originalName: { contains: normalizedSearch, mode: 'insensitive' } },
      { filename: { contains: normalizedSearch, mode: 'insensitive' } },
      { altText: { contains: normalizedSearch, mode: 'insensitive' } },
      { caption: { contains: normalizedSearch, mode: 'insensitive' } },
      { seoTitle: { contains: normalizedSearch, mode: 'insensitive' } },
      { seoDescription: { contains: normalizedSearch, mode: 'insensitive' } },
    ];
  }

  if (pagination) {
    const [items, totalItems] = await Promise.all([
      prisma.mediaAsset.findMany({
        where,
        select: publicMediaAssetSelect,
        orderBy: [{ createdAt: 'desc' }, { filename: 'asc' }],
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      prisma.mediaAsset.count({ where }),
    ]);

    return buildPaginatedResult({
      items: items.map((item) => serializeMediaAsset(item)),
      page: pagination.page,
      limit: pagination.limit,
      totalItems,
    }) satisfies PaginatedResult<ReturnType<typeof serializeMediaAsset>>;
  }

  const items = await prisma.mediaAsset.findMany({
    where,
    select: publicMediaAssetSelect,
    orderBy: [{ createdAt: 'desc' }, { filename: 'asc' }],
  });

  return items.map((item) => serializeMediaAsset(item));
};

export const getMediaAssetUsageSummaries = async (ids: string[]) => {
  const uniqueIds = Array.from(new Set(ids));

  if (uniqueIds.length === 0) {
    throw new ApiError(400, 'Select at least one media asset.');
  }

  const assets = await prisma.mediaAsset.findMany({
    where: {
      id: {
        in: uniqueIds,
      },
    },
    select: {
      id: true,
      publicUrl: true,
      url: true,
      path: true,
      storageKey: true,
    },
  });

  if (assets.length === 0) {
    throw new ApiError(404, 'No matching media assets were found.');
  }

  const summaries = await Promise.all(assets.map((asset) => getMediaAssetUsageSummary(asset)));
  const summaryMap = new Map(summaries.map((summary) => [summary.assetId, summary]));

  return uniqueIds
    .map((id) => summaryMap.get(id))
    .filter((summary): summary is MediaAssetUsageSummary => Boolean(summary));
};

export const updateMediaAsset = async (id: string, input: UpdateMediaAssetInput) => {
  const existingMediaAsset = await prisma.mediaAsset.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingMediaAsset) {
    throw new ApiError(404, 'Media asset not found.');
  }

  const updatedAsset = await prisma.mediaAsset.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: normalizeNullableString(input.title) } : {}),
      ...(input.altText !== undefined ? { altText: normalizeNullableString(input.altText) } : {}),
      ...(input.caption !== undefined ? { caption: normalizeNullableString(input.caption) } : {}),
      ...(input.seoTitle !== undefined ? { seoTitle: normalizeNullableString(input.seoTitle) } : {}),
      ...(input.seoDescription !== undefined
        ? { seoDescription: normalizeNullableString(input.seoDescription) }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
    select: publicMediaAssetSelect,
  });

  return serializeMediaAsset(updatedAsset);
};

const removeStoredMediaFile = async (storageKey?: string | null, pathValue?: string | null) => {
  const relativePath = normalizeNullableString(storageKey) ?? normalizeNullableString(pathValue);

  if (!relativePath) {
    return;
  }

  try {
    await storageAdapter.remove(relativePath);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[media-assets] Failed to remove stored media file.', {
        relativePath,
        reason: error instanceof Error ? error.message : 'Unknown storage error.',
      });
    }
  }
};

export const deleteMediaAsset = async (id: string) => {
  const existingMediaAsset = await prisma.mediaAsset.findUnique({
    where: { id },
    select: {
      id: true,
      storageKey: true,
      path: true,
    },
  });

  if (!existingMediaAsset) {
    throw new ApiError(404, 'Media asset not found.');
  }

  await prisma.mediaAsset.delete({
    where: { id },
  });

  await removeStoredMediaFile(existingMediaAsset.storageKey, existingMediaAsset.path);

  return { id: existingMediaAsset.id };
};

export const bulkDeleteMediaAssets = async (ids: string[]): Promise<DeleteMediaAssetsResult> => {
  const uniqueIds = Array.from(new Set(ids));

  if (uniqueIds.length === 0) {
    throw new ApiError(400, 'Select at least one media asset to delete.');
  }

  const existingMediaAssets = await prisma.mediaAsset.findMany({
    where: {
      id: {
        in: uniqueIds,
      },
    },
    select: {
      id: true,
      storageKey: true,
      path: true,
    },
  });

  if (existingMediaAssets.length === 0) {
    throw new ApiError(404, 'No matching media assets were found to delete.');
  }

  const existingIds = existingMediaAssets.map((item) => item.id);

  await prisma.mediaAsset.deleteMany({
    where: {
      id: {
        in: existingIds,
      },
    },
  });

  await Promise.all(
    existingMediaAssets.map((item) =>
      removeStoredMediaFile(item.storageKey, item.path),
    ),
  );

  return {
    deletedIds: existingIds,
    deletedCount: existingIds.length,
  };
};
