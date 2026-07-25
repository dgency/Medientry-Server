import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { MediaAsset } from '@prisma/client';

import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { uploadsRootDirectory } from '../config/upload';
import { ApiError } from '../utils/api-error';
import { getLegacyUploadReference } from '../utils/media-migration';
import { buildPublicMediaPath } from '../utils/media-public-url';
import { resolvePublicMediaUrl } from '../utils/media-path';

export type MediaStorageDriver = 'database' | 'local';

export type StorageHealthStatus = {
  driver: MediaStorageDriver;
  configured: boolean;
  writable: boolean | null;
  persistent: boolean;
  publicBaseUrl: string | null;
  warning: string | null;
  metadataAccessible: boolean | null;
  blobAccessible: boolean | null;
  legacyFilesystemFallbackEnabled: boolean;
};

export type MediaAssetStorageRecord = Pick<
  MediaAsset,
  | 'id'
  | 'filename'
  | 'mimeType'
  | 'path'
  | 'publicUrl'
  | 'sha256'
  | 'size'
  | 'storageKey'
  | 'storageType'
  | 'url'
>;

type SaveLocalMediaFileInput = {
  buffer: Buffer;
  folder: string;
  filename: string;
};

type StoredMediaBinary = {
  buffer: Buffer;
  contentLength: number;
};

export const mediaStorageDriver: MediaStorageDriver = env.STORAGE_DRIVER;
export const legacyFilesystemFallbackEnabled = env.MEDIA_ENABLE_LEGACY_FILESYSTEM_FALLBACK;

const normalizeNullableString = (value?: string | null) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue === '' ? null : trimmedValue;
};

const normalizeStorageKey = (value: string) =>
  value.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/{2,}/g, '/');

const resolveConfiguredPublicBaseUrl = () => {
  const configuredBaseUrl =
    env.SERVER_PUBLIC_URL?.trim()
    || env.PUBLIC_BASE_URL?.trim()
    || '';

  if (!configuredBaseUrl) {
    return null;
  }

  try {
    return new URL(configuredBaseUrl).origin;
  } catch {
    return null;
  }
};

const resolveLocalAbsolutePath = (storageKey: string) => {
  const normalizedStorageKey = normalizeStorageKey(storageKey);
  const absolutePath = path.resolve(uploadsRootDirectory, normalizedStorageKey);
  const relativeToRoot = path.relative(uploadsRootDirectory, absolutePath);

  if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
    throw new Error(`Refusing to access media outside the upload directory: ${storageKey}`);
  }

  return absolutePath;
};

const buildUploadsPublicPath = (storageKey: string) => {
  const normalizedStorageKey = normalizeStorageKey(storageKey);
  const relativeUploadsPath = `/uploads/${normalizedStorageKey}`;
  return resolvePublicMediaUrl(relativeUploadsPath) ?? relativeUploadsPath;
};

const resolveFilesystemStorageKey = (asset: Pick<MediaAssetStorageRecord, 'path' | 'publicUrl' | 'storageKey' | 'url'>) => {
  const explicitStorageKey = normalizeNullableString(asset.storageKey);

  if (explicitStorageKey) {
    return normalizeStorageKey(explicitStorageKey.replace(/^uploads\//i, ''));
  }

  const legacyReference =
    getLegacyUploadReference(asset.path)
    ?? getLegacyUploadReference(asset.publicUrl)
    ?? getLegacyUploadReference(asset.url);

  if (!legacyReference) {
    return null;
  }

  return normalizeStorageKey(legacyReference.relativeFilePath);
};

const isDatabaseStoredAsset = (asset: Pick<MediaAssetStorageRecord, 'storageType'>) =>
  asset.storageType === 'database';

export const isProductionUsingLocalStorage =
  env.NODE_ENV === 'production' && mediaStorageDriver === 'local';

export const assertMediaUploadsWritable = () => {
  if (!isProductionUsingLocalStorage) {
    return;
  }

  throw new ApiError(
    503,
    'Uploads are disabled because STORAGE_DRIVER=local uses ephemeral App Platform storage in production. Set STORAGE_DRIVER=database.',
  );
};

export const buildDatabaseStorageKey = (mediaId: string, filename: string) =>
  normalizeStorageKey(path.posix.join('media', mediaId, filename));

export const buildMediaAssetPublicUrl = ({
  filename,
  id,
  publicUrl,
  storageKey,
  storageType,
  url,
}: Pick<MediaAssetStorageRecord, 'filename' | 'id' | 'publicUrl' | 'storageKey' | 'storageType' | 'url'>) => {
  const resolvedStoredUrl = resolvePublicMediaUrl(publicUrl) ?? resolvePublicMediaUrl(url);

  if (resolvedStoredUrl) {
    return resolvedStoredUrl;
  }

  if (storageType === 'database') {
    const publicPath = buildPublicMediaPath(id, filename);
    return resolvePublicMediaUrl(publicPath) ?? publicPath;
  }

  const filesystemStorageKey = storageKey ? normalizeStorageKey(storageKey) : null;

  if (!filesystemStorageKey) {
    return null;
  }

  return buildUploadsPublicPath(filesystemStorageKey);
};

export const saveLocalMediaFile = async ({
  buffer,
  filename,
  folder,
}: SaveLocalMediaFileInput) => {
  const storageKey = normalizeStorageKey(path.posix.join(folder, filename));
  const absolutePath = resolveLocalAbsolutePath(storageKey);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer);

  const publicPath = buildUploadsPublicPath(storageKey);

  return {
    filename,
    path: storageKey,
    publicUrl: publicPath,
    storageKey,
    storageType: 'filesystem' as const,
    url: publicPath,
  };
};

export const readStoredMediaBinary = async (
  asset: MediaAssetStorageRecord,
): Promise<StoredMediaBinary | null> => {
  if (isDatabaseStoredAsset(asset)) {
    const blob = await prisma.mediaBlob.findUnique({
      where: { mediaId: asset.id },
      select: { data: true },
    });

    if (!blob?.data) {
      return null;
    }

    const buffer = Buffer.from(blob.data);
    return {
      buffer,
      contentLength: buffer.length,
    };
  }

  const storageKey = resolveFilesystemStorageKey(asset);

  if (!storageKey) {
    return null;
  }

  try {
    const buffer = await readFile(resolveLocalAbsolutePath(storageKey));
    return {
      buffer,
      contentLength: buffer.length,
    };
  } catch {
    return null;
  }
};

export const storedMediaExists = async (asset: MediaAssetStorageRecord) => {
  if (isDatabaseStoredAsset(asset)) {
    const blob = await prisma.mediaBlob.findUnique({
      where: { mediaId: asset.id },
      select: { mediaId: true },
    });

    return Boolean(blob);
  }

  const storageKey = resolveFilesystemStorageKey(asset);

  if (!storageKey) {
    return false;
  }

  try {
    await access(resolveLocalAbsolutePath(storageKey));
    return true;
  } catch {
    return false;
  }
};

export const removeStoredMedia = async (
  asset: Pick<MediaAssetStorageRecord, 'path' | 'publicUrl' | 'storageKey' | 'storageType' | 'url'>,
) => {
  if (asset.storageType === 'database') {
    return;
  }

  const storageKey = resolveFilesystemStorageKey(asset);

  if (!storageKey) {
    return;
  }

  try {
    await rm(resolveLocalAbsolutePath(storageKey), { force: true });
  } catch (error) {
    if (env.NODE_ENV !== 'production') {
      console.warn('[media-storage] Failed to remove filesystem media.', {
        storageKey,
        reason: error instanceof Error ? error.message : 'Unknown filesystem error.',
      });
    }
  }
};

export const getStorageHealthStatus = async (): Promise<StorageHealthStatus> => {
  const publicBaseUrl = resolveConfiguredPublicBaseUrl();

  if (mediaStorageDriver === 'database') {
    try {
      await prisma.mediaAsset.count({ take: 0 });
      await prisma.mediaBlob.count({ take: 0 });

      return {
        driver: mediaStorageDriver,
        configured: Boolean(env.DATABASE_URL?.trim()),
        writable: true,
        persistent: true,
        publicBaseUrl,
        warning: null,
        metadataAccessible: true,
        blobAccessible: true,
        legacyFilesystemFallbackEnabled,
      };
    } catch {
      return {
        driver: mediaStorageDriver,
        configured: Boolean(env.DATABASE_URL?.trim()),
        writable: false,
        persistent: true,
        publicBaseUrl,
        warning: 'Database-backed media storage is configured but not fully reachable.',
        metadataAccessible: false,
        blobAccessible: false,
        legacyFilesystemFallbackEnabled,
      };
    }
  }

  try {
    await access(uploadsRootDirectory);

    return {
      driver: mediaStorageDriver,
      configured: true,
      writable: true,
      persistent: false,
      publicBaseUrl,
      warning: isProductionUsingLocalStorage
        ? 'Local App Platform storage is ephemeral.'
        : null,
      metadataAccessible: null,
      blobAccessible: null,
      legacyFilesystemFallbackEnabled,
    };
  } catch {
    return {
      driver: mediaStorageDriver,
      configured: true,
      writable: false,
      persistent: false,
      publicBaseUrl,
      warning: isProductionUsingLocalStorage
        ? 'Local App Platform storage is ephemeral.'
        : 'Local upload storage is not accessible.',
      metadataAccessible: null,
      blobAccessible: null,
      legacyFilesystemFallbackEnabled,
    };
  }
};
