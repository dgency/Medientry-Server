import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { env, projectRoot } from './env';

const resolveLocalUploadDirectory = () => {
  const configuredDirectory = env.LOCAL_UPLOAD_DIR.trim();

  if (path.isAbsolute(configuredDirectory)) {
    return path.normalize(configuredDirectory);
  }

  return path.resolve(projectRoot, configuredDirectory);
};

export const uploadsRootDirectory = resolveLocalUploadDirectory();

if (env.STORAGE_DRIVER === 'local' || env.MEDIA_ENABLE_LEGACY_FILESYSTEM_FALLBACK) {
  mkdirSync(uploadsRootDirectory, { recursive: true });
}

export const uploadKinds = ['image', 'document', 'videoThumbnail'] as const;

export type UploadKind = (typeof uploadKinds)[number];

export type UploadRule = {
  allowedMimeTypes: string[];
  maxFileSizeInBytes: number;
  targetFolder: string;
};

export const uploadRules: Record<UploadKind, UploadRule> = {
  image: {
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/svg+xml',
      'image/x-icon',
      'image/vnd.microsoft.icon',
    ],
    maxFileSizeInBytes: env.MEDIA_MAX_IMAGE_BYTES,
    targetFolder: 'images',
  },
  document: {
    allowedMimeTypes: ['application/pdf'],
    maxFileSizeInBytes: env.MEDIA_MAX_DOCUMENT_BYTES,
    targetFolder: 'documents',
  },
  videoThumbnail: {
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/svg+xml',
      'image/x-icon',
      'image/vnd.microsoft.icon',
    ],
    maxFileSizeInBytes: env.MEDIA_MAX_IMAGE_BYTES,
    targetFolder: 'images',
  },
};

export const maxUploadSizeInBytes = Math.max(
  ...Object.values(uploadRules).map((rule) => rule.maxFileSizeInBytes),
);
