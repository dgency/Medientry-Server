import fs from 'node:fs';
import path from 'node:path';

import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { buildPublicMediaUrl, isAbsoluteHttpUrl, normalizeStoredMediaValue } from '../utils/media';
import { mapLegacyGalleryItemToListItem, mapMediaAssetToListItem, mediaAssetSelect } from '../utils/media-response';

const uploadsRoot = path.resolve(process.cwd(), 'uploads');
const clientPublicRoot = path.resolve(process.cwd(), '..', 'Medientry-Client', 'public');

const buildLocalAbsolutePath = (value?: string | null) => {
  const normalizedValue = normalizeStoredMediaValue(value);

  if (!normalizedValue || isAbsoluteHttpUrl(normalizedValue)) {
    return null;
  }

  if (normalizedValue.startsWith('/uploads/')) {
    return path.join(uploadsRoot, normalizedValue.replace(/^\/uploads\//, ''));
  }

  if (normalizedValue.startsWith('/images/') || normalizedValue.startsWith('/home-page-icons/')) {
    return path.join(clientPublicRoot, normalizedValue.replace(/^\/+/, ''));
  }

  return null;
};

const baseUrls = {
  backendBaseUrl: env.PUBLIC_BASE_URL ?? `http://localhost:${env.PORT}`,
  frontendBaseUrl: env.CLIENT_URL,
};

async function run() {
  const [mediaAssets, galleryItems] = await Promise.all([
    prisma.mediaAsset.findMany({
      select: mediaAssetSelect,
    }),
    prisma.galleryItem.findMany(),
  ]);

  const mappedMediaAssets = mediaAssets.map(mapMediaAssetToListItem);
  const mappedLegacyGalleryItems = galleryItems.map(mapLegacyGalleryItemToListItem);
  const allItems = [...mappedMediaAssets, ...mappedLegacyGalleryItems];

  const malformedUrls = allItems.filter((item) => !item.url || !buildPublicMediaUrl(item.storedValue ?? item.url, baseUrls));
  const windowsPaths = allItems.filter((item) => /[a-z]:\\/i.test(item.path ?? '') || /[a-z]:\\/i.test(item.storedValue ?? ''));
  const missingFiles = allItems.filter((item) => {
    const absolutePath = buildLocalAbsolutePath(item.storedValue ?? item.path ?? item.url);
    return absolutePath ? !fs.existsSync(absolutePath) : false;
  });
  const unsupportedMimeTypes = mappedMediaAssets.filter(
    (item) => item.mimeType && item.kind === 'unknown',
  );

  const duplicateStorageKeys = Array.from(
    mappedMediaAssets.reduce((map, item) => {
      const storageKey = item.storageKey ?? '';

      if (!storageKey) {
        return map;
      }

      const nextValue = map.get(storageKey) ?? [];
      nextValue.push(item.id);
      map.set(storageKey, nextValue);
      return map;
    }, new Map<string, string[]>()),
  )
    .filter(([, ids]) => ids.length > 1)
    .map(([storageKey, ids]) => ({ storageKey, ids }));

  const report = {
    generatedAt: new Date().toISOString(),
    totals: {
      mediaAssets: mappedMediaAssets.length,
      legacyGalleryItems: mappedLegacyGalleryItems.length,
      allMediaSources: allItems.length,
    },
    issues: {
      malformedUrls: malformedUrls.map((item) => ({ id: item.id, source: item.source, storedValue: item.storedValue, url: item.url })),
      missingFiles: missingFiles.map((item) => ({ id: item.id, source: item.source, storedValue: item.storedValue, url: item.url })),
      windowsPaths: windowsPaths.map((item) => ({ id: item.id, source: item.source, path: item.path, storedValue: item.storedValue })),
      duplicateStorageKeys,
      unsupportedMimeTypes: unsupportedMimeTypes.map((item) => ({ id: item.id, mimeType: item.mimeType, filename: item.filename })),
    },
  };

  console.log(JSON.stringify(report, null, 2));
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
