import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';

import type { Request } from 'express';
import { MediaKind, SimpleStatus } from '@prisma/client';

import { type UploadKind, uploadRules } from '../config/upload';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/api-error';
import { publicMediaAssetSelect, resolveMediaAssetUrl, serializeMediaAsset } from '../utils/media-asset-response';
import { sanitizeMediaFilename } from '../utils/media-public-url';
import {
  assertMediaUploadsWritable,
  buildDatabaseStorageKey,
  buildMediaAssetPublicUrl,
  mediaStorageDriver,
  removeStoredMedia,
  saveLocalMediaFile,
} from './storage.service';

type UploadFileInput = {
  file: Express.Multer.File;
  kind?: string;
  request: Request;
};

const mimeTypeToExtensionMap: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/svg+xml': '.svg',
  'image/webp': '.webp',
  'image/x-icon': '.ico',
  'image/vnd.microsoft.icon': '.ico',
};

const allowedExtensionsByKind: Record<UploadKind, string[]> = {
  image: ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.ico'],
  document: ['.pdf'],
  videoThumbnail: ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.ico'],
};

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const isUploadKind = (value: string): value is UploadKind => value in uploadRules;

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
  const extensionFromMimeType = mimeTypeToExtensionMap[file.mimetype];

  if (extensionFromMimeType) {
    return extensionFromMimeType;
  }

  const extensionFromOriginalName = path.extname(file.originalname).toLowerCase();

  if (extensionFromOriginalName) {
    return extensionFromOriginalName;
  }

  throw new ApiError(400, 'Could not determine file extension.');
};

const stripUtf8Bom = (value: string) =>
  value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;

const isSafeSvg = (buffer: Buffer) => {
  const rawContent = stripUtf8Bom(buffer.toString('utf8').trimStart());

  if (!rawContent.startsWith('<') || !/<svg[\s>]/i.test(rawContent)) {
    return false;
  }

  return !(
    /<script[\s>]/i.test(rawContent)
    || /<foreignObject[\s>]/i.test(rawContent)
    || /\son[a-z]+\s*=/i.test(rawContent)
    || /javascript:/i.test(rawContent)
  );
};

const validateMimeSignature = (mimeType: string, buffer: Buffer) => {
  switch (mimeType) {
    case 'application/pdf':
      return buffer.subarray(0, 5).toString('utf8') === '%PDF-';
    case 'image/jpeg':
      return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case 'image/png':
      return buffer.length >= pngSignature.length && buffer.subarray(0, pngSignature.length).equals(pngSignature);
    case 'image/webp':
      return buffer.length >= 12
        && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
        && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
    case 'image/x-icon':
    case 'image/vnd.microsoft.icon':
      return buffer.length >= 4 && buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x01 && buffer[3] === 0x00;
    case 'image/svg+xml':
      return isSafeSvg(buffer);
    default:
      return false;
  }
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

const buildStoredFilename = (originalName: string, mediaId: string, extension: string) => {
  const safeExtension = extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`;
  const filenameBase = sanitizeMediaFilename(path.parse(originalName).name || 'file');
  return `${filenameBase}-${mediaId.slice(0, 8)}${safeExtension}`;
};

const calculateSha256 = (buffer: Buffer) => createHash('sha256').update(buffer).digest('hex');

export const uploadFile = async ({ file, kind, request }: UploadFileInput) => {
  assertMediaUploadsWritable();

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

  if (!validateMimeSignature(file.mimetype, file.buffer)) {
    throw new ApiError(400, 'The uploaded file content does not match the declared file type.');
  }

  const requestLabel = `${request.method.toUpperCase()} ${request.originalUrl}`;
  const mediaId = randomUUID();
  const filename = buildStoredFilename(file.originalname, mediaId, extension);
  const sha256 = calculateSha256(file.buffer);

  console.info('[uploads] Upload started.', {
    request: requestLabel,
    kind: resolvedKind,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    storageDriver: mediaStorageDriver,
  });

  let storedFile:
    | {
      path: string;
      publicUrl: string;
      storageKey: string;
      storageType: 'database' | 'filesystem';
      url: string;
    }
    | null = null;

  try {
    if (mediaStorageDriver === 'database') {
      const databaseStorageKey = buildDatabaseStorageKey(mediaId, filename);
      const publicUrl = buildMediaAssetPublicUrl({
        id: mediaId,
        filename,
        publicUrl: null,
        storageKey: databaseStorageKey,
        storageType: 'database',
        url: null,
      });

      if (!publicUrl) {
        throw new ApiError(500, 'Failed to build the public media URL.');
      }

      storedFile = {
        path: publicUrl,
        publicUrl,
        storageKey: databaseStorageKey,
        storageType: 'database',
        url: publicUrl,
      };

      const mediaAsset = await prisma.mediaAsset.create({
        data: {
          id: mediaId,
          title: deriveMediaAssetTitle(file.originalname, filename),
          filename,
          originalName: file.originalname,
          path: storedFile.path,
          url: storedFile.url,
          publicUrl: storedFile.publicUrl,
          storageKey: storedFile.storageKey,
          storageType: storedFile.storageType,
          mimeType: file.mimetype,
          extension,
          sha256,
          fileType: resolveMediaKind(resolvedKind, file.mimetype),
          size: file.buffer.length,
          status: SimpleStatus.ACTIVE,
          blob: {
            create: {
              data: new Uint8Array(file.buffer),
            },
          },
        },
        select: publicMediaAssetSelect,
      });

      const serializedMediaAsset = serializeMediaAsset(mediaAsset);
      const mediaAssetUrl = resolveMediaAssetUrl(serializedMediaAsset) ?? storedFile.publicUrl;

      console.info('[uploads] Upload completed.', {
        request: requestLabel,
        assetId: mediaAsset.id,
        storageKey: storedFile.storageKey,
        provider: mediaStorageDriver,
        publicUrl: mediaAssetUrl,
      });

      return {
        id: mediaAsset.id,
        url: mediaAssetUrl,
        fullUrl: mediaAssetUrl,
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.buffer.length,
        width: serializedMediaAsset.width,
        height: serializedMediaAsset.height,
        storageType: serializedMediaAsset.storageType,
        createdAt: serializedMediaAsset.createdAt,
        asset: serializedMediaAsset,
      };
    }

    storedFile = await saveLocalMediaFile({
      buffer: file.buffer,
      folder: rule.targetFolder,
      filename,
    });

    const mediaAsset = await prisma.mediaAsset.create({
      data: {
        id: mediaId,
        title: deriveMediaAssetTitle(file.originalname, filename),
        filename,
        originalName: file.originalname,
        path: storedFile.path,
        url: storedFile.url,
        publicUrl: storedFile.publicUrl,
        storageKey: storedFile.storageKey,
        storageType: storedFile.storageType,
        mimeType: file.mimetype,
        extension,
        sha256,
        fileType: resolveMediaKind(resolvedKind, file.mimetype),
        size: file.buffer.length,
        status: SimpleStatus.ACTIVE,
      },
      select: publicMediaAssetSelect,
    });

    const serializedMediaAsset = serializeMediaAsset(mediaAsset);
    const mediaAssetUrl = resolveMediaAssetUrl(serializedMediaAsset) ?? storedFile.publicUrl;

    console.info('[uploads] Upload completed.', {
      request: requestLabel,
      assetId: mediaAsset.id,
      storageKey: storedFile.storageKey,
      provider: mediaStorageDriver,
      publicUrl: mediaAssetUrl,
    });

    return {
      id: mediaAsset.id,
      url: mediaAssetUrl,
      fullUrl: mediaAssetUrl,
      filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.buffer.length,
      width: serializedMediaAsset.width,
      height: serializedMediaAsset.height,
      storageType: serializedMediaAsset.storageType,
      createdAt: serializedMediaAsset.createdAt,
      asset: serializedMediaAsset,
    };
  } catch (error) {
    if (storedFile?.storageType === 'filesystem') {
      try {
        const cleanupAsset = {
          path: storedFile.path,
          publicUrl: storedFile.publicUrl,
          storageKey: storedFile.storageKey,
          storageType: storedFile.storageType,
          url: storedFile.url,
        };
        await removeStoredMedia(cleanupAsset);
      } catch (cleanupError) {
        console.error('[uploads] Failed to remove orphaned upload after database failure.', {
          storageKey: storedFile.storageKey,
          reason:
            cleanupError instanceof Error ? cleanupError.message : 'Unknown cleanup error.',
        });
      }
    }

    console.error('[uploads] Upload failed.', {
      request: requestLabel,
      storageKey: storedFile?.storageKey ?? null,
      reason: error instanceof Error ? error.message : 'Unknown upload error.',
    });
    throw error;
  }
};
