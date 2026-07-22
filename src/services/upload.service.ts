import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import { MediaKind, SimpleStatus } from '@prisma/client';

import { type UploadKind, uploadRules } from '../config/upload';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/api-error';
import { publicMediaAssetSelect, resolveMediaAssetUrl, serializeMediaAsset } from '../utils/media-asset-response';
import { storageAdapter } from './storage.service';

type UploadFileInput = {
  file: Express.Multer.File;
  kind?: string;
  request: Request;
};

const mimeTypeToExtensionMap: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'image/x-icon': '.ico',
  'image/vnd.microsoft.icon': '.ico',
};

const allowedExtensionsByKind: Record<UploadKind, string[]> = {
  image: ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.ico'],
  document: ['.pdf'],
  videoThumbnail: ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.ico'],
};

const isUploadKind = (value: string): value is UploadKind => {
  return value in uploadRules;
};

const resolveUploadKind = (value: string | undefined, file: Express.Multer.File) => {
  if (value && isUploadKind(value)) {
    return value;
  }

  if (file.mimetype === 'application/pdf') {
    return 'document' satisfies UploadKind;
  }

  return 'image' satisfies UploadKind;
};

const resolveFileExtension = (file: Express.Multer.File) => {
  const extensionFromOriginalName = path.extname(file.originalname).toLowerCase();

  if (extensionFromOriginalName) {
    return extensionFromOriginalName;
  }

  const extensionFromMimeType = mimeTypeToExtensionMap[file.mimetype];

  if (!extensionFromMimeType) {
    throw new ApiError(400, 'Could not determine file extension.');
  }

  return extensionFromMimeType;
};

const deriveMediaAssetTitle = (originalName: string, storedFilename: string) => {
  const candidate = path.parse(originalName).name || path.parse(storedFilename).name;
  const normalized = candidate.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  return normalized || null;
};

const resolveMediaKind = (kind: UploadKind, mimeType: string) => {
  if (kind === 'document') {
    return MediaKind.DOCUMENT;
  }

  if (mimeType === 'image/svg+xml') {
    return MediaKind.SVG;
  }

  return MediaKind.IMAGE;
};

export const uploadFile = async ({ file, kind, request }: UploadFileInput) => {
  const resolvedKind = resolveUploadKind(kind, file);
  const rule = uploadRules[resolvedKind];
  const extension = resolveFileExtension(file);

  if (!rule.allowedMimeTypes.includes(file.mimetype)) {
    throw new ApiError(400, `Invalid file type for ${resolvedKind} upload.`);
  }

  if (!allowedExtensionsByKind[resolvedKind].includes(extension)) {
    throw new ApiError(400, `Invalid file extension for ${resolvedKind} upload.`);
  }

  if (file.size > rule.maxFileSizeInBytes) {
    throw new ApiError(
      400,
      `File exceeds the ${Math.round(rule.maxFileSizeInBytes / (1024 * 1024))}MB limit for ${resolvedKind} uploads.`,
    );
  }

  const requestLabel = `${request.method.toUpperCase()} ${request.originalUrl}`;
  console.info('[uploads] Upload started.', {
    request: requestLabel,
    kind: resolvedKind,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    storageDriver: storageAdapter.driver,
  });

  const storedFile = await storageAdapter.save({
    buffer: file.buffer,
    folder: rule.targetFolder,
    extension,
    mimeType: file.mimetype,
    originalName: file.originalname,
  });

  try {
    const mediaAsset = await prisma.mediaAsset.create({
      data: {
        id: randomUUID(),
        title: deriveMediaAssetTitle(file.originalname, storedFile.filename),
        filename: storedFile.filename,
        originalName: file.originalname,
        path: storedFile.relativePath,
        url: storedFile.publicPath,
        publicUrl: storedFile.publicPath,
        storageKey: storedFile.storageKey,
        mimeType: file.mimetype,
        extension,
        fileType: resolveMediaKind(resolvedKind, file.mimetype),
        size: file.size,
        status: SimpleStatus.ACTIVE,
      },
      select: publicMediaAssetSelect,
    });
    const serializedMediaAsset = serializeMediaAsset(mediaAsset);
    const mediaAssetUrl = resolveMediaAssetUrl(serializedMediaAsset) ?? storedFile.publicPath;

    console.info('[uploads] Upload completed.', {
      request: requestLabel,
      assetId: mediaAsset.id,
      storageKey: storedFile.storageKey,
      provider: storedFile.provider,
      publicUrl: mediaAssetUrl,
    });

    return {
      url: mediaAssetUrl,
      fullUrl: mediaAssetUrl,
      filename: storedFile.filename,
      asset: serializedMediaAsset,
    };
  } catch (error) {
    try {
      await storageAdapter.remove(storedFile.storageKey);
    } catch (cleanupError) {
      console.error('[uploads] Failed to remove orphaned upload after database failure.', {
        storageKey: storedFile.storageKey,
        reason:
          cleanupError instanceof Error ? cleanupError.message : 'Unknown cleanup error.',
      });
    }

    console.error('[uploads] Database write failed after upload.', {
      request: requestLabel,
      storageKey: storedFile.storageKey,
      reason: error instanceof Error ? error.message : 'Unknown database error.',
    });
    throw error;
  }
};
