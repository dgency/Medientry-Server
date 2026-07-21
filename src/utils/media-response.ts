import { MediaKind, Prisma, SimpleStatus, type GalleryItem, type MediaAsset } from '@prisma/client';

import { env } from '../config/env';
import {
  buildPublicMediaUrl,
  detectMediaKind,
  getFileExtension,
  mediaKindToClientKind,
  normalizeStoredMediaValue,
} from './media';

export const mediaAssetSelect = Prisma.validator<Prisma.MediaAssetSelect>()({
  id: true,
  title: true,
  altText: true,
  caption: true,
  filename: true,
  originalName: true,
  path: true,
  url: true,
  publicUrl: true,
  storageKey: true,
  mimeType: true,
  extension: true,
  fileType: true,
  size: true,
  width: true,
  height: true,
  duration: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

type SelectedMediaAsset = Prisma.MediaAssetGetPayload<{
  select: typeof mediaAssetSelect;
}>;

export type MediaListItem = {
  id: string;
  source: 'media' | 'gallery-legacy';
  title: string | null;
  altText: string | null;
  caption: string | null;
  filename: string;
  originalName: string | null;
  path: string | null;
  url: string | null;
  storedValue: string | null;
  publicUrl: string | null;
  storageKey: string | null;
  mimeType: string | null;
  extension: string | null;
  kind: ReturnType<typeof mediaKindToClientKind>;
  size: number | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  status: SimpleStatus;
  thumbnailUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const baseUrls = {
  backendBaseUrl: env.PUBLIC_BASE_URL ?? `http://localhost:${env.PORT}`,
  frontendBaseUrl: env.CLIENT_URL,
};

const buildMediaFilename = (value?: string | null, fallbackTitle?: string | null) => {
  const normalizedValue = normalizeStoredMediaValue(value);

  if (normalizedValue) {
    const sanitizedValue = normalizedValue.split('?')[0].split('#')[0];
    const segments = sanitizedValue.split('/').filter(Boolean);

    if (segments.length > 0) {
      return segments[segments.length - 1];
    }
  }

  return fallbackTitle?.trim() || 'media-file';
};

export const mapMediaAssetToListItem = (item: SelectedMediaAsset): MediaListItem => {
  const storedValue = normalizeStoredMediaValue(item.publicUrl ?? item.url ?? item.path);
  const publicUrl = buildPublicMediaUrl(item.publicUrl ?? item.url ?? item.path, baseUrls);
  const extension = item.extension?.trim().toLowerCase() || getFileExtension(storedValue) || getFileExtension(publicUrl);
  const fileType = item.fileType === MediaKind.UNKNOWN
    ? detectMediaKind(item.mimeType, extension ?? storedValue)
    : item.fileType;

  return {
    id: item.id,
    source: 'media',
    title: item.title ?? null,
    altText: item.altText ?? null,
    caption: item.caption ?? null,
    filename: item.filename,
    originalName: item.originalName ?? null,
    path: item.path ?? null,
    url: publicUrl,
    storedValue,
    publicUrl,
    storageKey: item.storageKey ?? null,
    mimeType: item.mimeType ?? null,
    extension: extension ?? null,
    kind: mediaKindToClientKind(fileType),
    size: item.size ?? null,
    width: item.width ?? null,
    height: item.height ?? null,
    duration: item.duration ?? null,
    status: item.status,
    thumbnailUrl: publicUrl,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

export const mapLegacyGalleryItemToListItem = (item: GalleryItem): MediaListItem => {
  const storedValue = normalizeStoredMediaValue(item.url);
  const thumbnailStoredValue = normalizeStoredMediaValue(item.thumbnail ?? item.url);
  const publicUrl = buildPublicMediaUrl(item.url, baseUrls);
  const thumbnailUrl = buildPublicMediaUrl(item.thumbnail ?? item.url, baseUrls);
  const mimeType = item.type === 'VIDEO' ? 'video/mp4' : null;
  const detectedKind = item.type === 'VIDEO'
    ? MediaKind.VIDEO
    : detectMediaKind(mimeType, storedValue ?? thumbnailStoredValue);

  return {
    id: item.id,
    source: 'gallery-legacy',
    title: item.title,
    altText: item.title,
    caption: item.category ?? null,
    filename: buildMediaFilename(storedValue ?? thumbnailStoredValue, item.title),
    originalName: null,
    path: storedValue,
    url: publicUrl,
    storedValue,
    publicUrl,
    storageKey: null,
    mimeType,
    extension: getFileExtension(storedValue ?? thumbnailStoredValue),
    kind: mediaKindToClientKind(detectedKind),
    size: null,
    width: null,
    height: null,
    duration: null,
    status: item.status,
    thumbnailUrl,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};
