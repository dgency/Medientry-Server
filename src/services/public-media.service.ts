import { MediaKind, Prisma, SimpleStatus } from '@prisma/client';

import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/api-error';
import { getLegacyUploadReference } from '../utils/media-migration';
import { sanitizeMediaFilename } from '../utils/media-public-url';
import { buildMediaAssetPublicUrl, readStoredMediaBinary } from './storage.service';

const publicMediaDeliverySelect = Prisma.validator<Prisma.MediaAssetSelect>()({
  id: true,
  filename: true,
  originalName: true,
  mimeType: true,
  size: true,
  sha256: true,
  fileType: true,
  status: true,
  storageKey: true,
  storageType: true,
  path: true,
  publicUrl: true,
  url: true,
});

type PublicMediaDeliveryRecord = Prisma.MediaAssetGetPayload<{
  select: typeof publicMediaDeliverySelect;
}>;

type PublicMediaResponse = {
  asset: PublicMediaDeliveryRecord;
  buffer: Buffer | null;
  headers: Record<string, string>;
  statusCode: 200 | 304;
};

const buildMediaEtag = (asset: Pick<PublicMediaDeliveryRecord, 'id' | 'sha256'>) =>
  `"${asset.sha256?.trim() || `media-${asset.id}`}"`;

const matchesIfNoneMatch = (headerValue: string | undefined, etag: string) => {
  if (!headerValue?.trim()) {
    return false;
  }

  if (headerValue.trim() === '*') {
    return true;
  }

  return headerValue
    .split(',')
    .map((item) => item.trim())
    .some((item) => item === etag);
};

const buildContentDisposition = (asset: Pick<PublicMediaDeliveryRecord, 'fileType' | 'filename' | 'originalName'>) => {
  const preferredFilename = sanitizeMediaFilename(asset.originalName || asset.filename || 'file');
  const dispositionType =
    asset.fileType === MediaKind.DOCUMENT
      ? 'inline'
      : 'inline';

  return `${dispositionType}; filename="${preferredFilename}"`;
};

export const buildPublicMediaHeaders = (
  asset: Pick<PublicMediaDeliveryRecord, 'fileType' | 'filename' | 'id' | 'mimeType' | 'originalName' | 'sha256'>,
  contentLength: number,
) => {
  const etag = buildMediaEtag(asset);

  return {
    'Cache-Control': `public, max-age=${env.MEDIA_CACHE_MAX_AGE}, immutable`,
    'Content-Disposition': buildContentDisposition(asset),
    'Content-Length': String(contentLength),
    'Content-Type': asset.mimeType?.trim() || 'application/octet-stream',
    'Cross-Origin-Resource-Policy': 'cross-origin',
    ETag: etag,
    'X-Content-Type-Options': 'nosniff',
  };
};

const getPublicMediaRecord = async (id: string) => {
  const asset = await prisma.mediaAsset.findUnique({
    where: { id },
    select: publicMediaDeliverySelect,
  });

  if (!asset || asset.status !== SimpleStatus.ACTIVE) {
    throw new ApiError(404, 'Media not found.');
  }

  return asset;
};

const buildAbsoluteLegacyUploadVariants = (normalizedPath: string) => {
  const candidateOrigins = [
    env.SERVER_PUBLIC_URL?.trim(),
    env.PUBLIC_BASE_URL?.trim(),
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.replace(/\/+$/, ''));

  return Array.from(new Set(candidateOrigins.map((origin) => `${origin}${normalizedPath}`)));
};

const getLegacyUploadMediaRecord = async (legacyPath: string) => {
  const reference = getLegacyUploadReference(legacyPath);

  if (!reference) {
    return null;
  }

  const absolutePathVariants = buildAbsoluteLegacyUploadVariants(reference.normalizedPath);
  const pathVariants = [
    reference.normalizedPath,
    reference.relativeFilePath,
    reference.storageKey,
    ...absolutePathVariants,
  ];

  return prisma.mediaAsset.findFirst({
    where: {
      status: SimpleStatus.ACTIVE,
      OR: [
        { path: { in: pathVariants } },
        { publicUrl: { in: [reference.normalizedPath, ...absolutePathVariants] } },
        { url: { in: [reference.normalizedPath, ...absolutePathVariants] } },
        { storageKey: { in: [reference.storageKey, reference.relativeFilePath] } },
      ],
    },
    select: publicMediaDeliverySelect,
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
  });
};

const buildPublicMediaResponseFromRecord = async ({
  asset,
  ifNoneMatch,
  includeBody,
}: {
  asset: PublicMediaDeliveryRecord;
  ifNoneMatch?: string;
  includeBody: boolean;
}): Promise<PublicMediaResponse | null> => {
  const etag = buildMediaEtag(asset);

  if (matchesIfNoneMatch(ifNoneMatch, etag)) {
    return {
      asset,
      buffer: null,
      headers: {
        ETag: etag,
        'Cache-Control': `public, max-age=${env.MEDIA_CACHE_MAX_AGE}, immutable`,
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'X-Content-Type-Options': 'nosniff',
      },
      statusCode: 304,
    };
  }

  const storedBinary = await readStoredMediaBinary(asset);

  if (!storedBinary) {
    return null;
  }

  const headers = buildPublicMediaHeaders(asset, asset.size ?? storedBinary.contentLength);

  return {
    asset: {
      ...asset,
      publicUrl: buildMediaAssetPublicUrl(asset),
    },
    buffer: includeBody ? storedBinary.buffer : null,
    headers,
    statusCode: 200,
  };
};

export const getPublicMediaResponse = async ({
  id,
  ifNoneMatch,
  includeBody,
}: {
  id: string;
  ifNoneMatch?: string;
  includeBody: boolean;
}): Promise<PublicMediaResponse> => {
  const asset = await getPublicMediaRecord(id);
  const response = await buildPublicMediaResponseFromRecord({
    asset,
    ifNoneMatch,
    includeBody,
  });

  if (!response) {
    throw new ApiError(404, 'Media file content is missing.');
  }

  return response;
};

export const getLegacyUploadMediaResponse = async ({
  legacyPath,
  ifNoneMatch,
  includeBody,
}: {
  legacyPath: string;
  ifNoneMatch?: string;
  includeBody: boolean;
}) => {
  const asset = await getLegacyUploadMediaRecord(legacyPath);

  if (!asset) {
    return null;
  }

  return buildPublicMediaResponseFromRecord({
    asset,
    ifNoneMatch,
    includeBody,
  });
};
