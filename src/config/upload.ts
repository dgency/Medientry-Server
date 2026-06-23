import path from 'node:path';

export const uploadsRootDirectory = path.resolve(process.cwd(), 'uploads');

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
    maxFileSizeInBytes: 10 * 1024 * 1024,
    targetFolder: 'images',
  },
  document: {
    allowedMimeTypes: ['application/pdf'],
    maxFileSizeInBytes: 10 * 1024 * 1024,
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
    maxFileSizeInBytes: 10 * 1024 * 1024,
    targetFolder: 'videos',
  },
};

export const maxUploadSizeInBytes = Math.max(
  ...Object.values(uploadRules).map((rule) => rule.maxFileSizeInBytes),
);
