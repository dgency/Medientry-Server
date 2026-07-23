import path from 'node:path';

import { normalizeStoredMediaValue } from './media-path';

export type LegacyUploadReference = {
  normalizedPath: string;
  relativeFilePath: string;
  storageKey: string;
  category: string;
};

export const getLegacyUploadReference = (value?: string | null): LegacyUploadReference | null => {
  const normalizedValue = normalizeStoredMediaValue(value);

  if (!normalizedValue?.startsWith('/uploads/')) {
    return null;
  }

  const relativeFilePath = normalizedValue.replace(/^\/uploads\//, '').replace(/^\/+/, '');
  const normalizedRelativeFilePath = relativeFilePath.replace(/\\/g, '/');
  const category = normalizedRelativeFilePath.split('/').find(Boolean) ?? 'uncategorized';

  return {
    normalizedPath: normalizedValue,
    relativeFilePath: normalizedRelativeFilePath,
    storageKey: `uploads/${normalizedRelativeFilePath}`,
    category,
  };
};

export const resolveLegacyUploadAbsolutePath = (
  uploadsRootDirectory: string,
  reference: LegacyUploadReference,
) => path.resolve(uploadsRootDirectory, reference.relativeFilePath.replace(/\//g, path.sep));
