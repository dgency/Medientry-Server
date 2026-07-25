import { MediaKind, Prisma, SimpleStatus } from '@prisma/client';

import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/api-error';
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
  const etag = buildMediaEtag(asset);

  if (matchesIfNoneMatch(ifNoneMatch, etag)) {
    return {
      asset,
      buffer: null,
      headers: {
        ETag: etag,
        'Cache-Control': `public, max-age=${env.MEDIA_CACHE_MAX_AGE}, immutable`,
        'X-Content-Type-Options': 'nosniff',
      },
      statusCode: 304,
    };
  }

  const storedBinary = await readStoredMediaBinary(asset);

  if (!storedBinary) {
    throw new ApiError(404, 'Media file content is missing.');
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
