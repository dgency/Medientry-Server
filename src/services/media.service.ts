import path from 'node:path';
import { MediaKind, Prisma, SimpleStatus } from '@prisma/client';

import { prisma } from '../config/prisma';
import { ApiError } from '../utils/api-error';
import { mediaAssetSelect, mapLegacyGalleryItemToListItem, mapMediaAssetToListItem, type MediaListItem } from '../utils/media-response';
import { detectMediaKind, getFileExtension, normalizeStoredMediaValue } from '../utils/media';
import { storageAdapter } from './storage.service';

type ListMediaInput = {
  page: number;
  pageSize: number;
  search: string;
  type: 'all' | 'image' | 'svg' | 'video' | 'document' | 'unknown';
  sort: 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'largest' | 'smallest';
  status: SimpleStatus | 'all';
};

type UpsertMediaMetadataInput = {
  title?: string | null;
  altText?: string | null;
  caption?: string | null;
  status?: SimpleStatus;
};

type CreateMediaAssetInput = {
  title?: string | null;
  altText?: string | null;
  caption?: string | null;
  filename: string;
  originalName?: string | null;
  path?: string | null;
  url?: string | null;
  publicUrl?: string | null;
  storageKey?: string | null;
  mimeType?: string | null;
  extension?: string | null;
  fileType?: MediaKind;
  size?: number | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  status?: SimpleStatus;
};

const getSearchHaystack = (item: MediaListItem) =>
  [
    item.title,
    item.filename,
    item.originalName,
    item.altText,
    item.caption,
    item.extension,
    item.mimeType,
    item.kind,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

const sortMediaItems = (
  items: MediaListItem[],
  sort: ListMediaInput['sort'],
) => {
  const nextItems = [...items];

  nextItems.sort((left, right) => {
    switch (sort) {
      case 'oldest':
        return left.createdAt.getTime() - right.createdAt.getTime();
      case 'name-asc':
        return (left.title ?? left.filename).localeCompare(right.title ?? right.filename, undefined, {
          sensitivity: 'base',
        });
      case 'name-desc':
        return (right.title ?? right.filename).localeCompare(left.title ?? left.filename, undefined, {
          sensitivity: 'base',
        });
      case 'largest':
        return (right.size ?? -1) - (left.size ?? -1);
      case 'smallest':
        return (left.size ?? Number.MAX_SAFE_INTEGER) - (right.size ?? Number.MAX_SAFE_INTEGER);
      case 'newest':
      default:
        return right.createdAt.getTime() - left.createdAt.getTime();
    }
  });

  return nextItems;
};

const mapListInputToStatusFilter = (status: ListMediaInput['status']) =>
  status === 'all' ? undefined : status;

const buildMediaAssetWhere = ({ search, status }: Pick<ListMediaInput, 'search' | 'status'>): Prisma.MediaAssetWhereInput => {
  const trimmedSearch = search.trim();

  return {
    ...(mapListInputToStatusFilter(status) ? { status: mapListInputToStatusFilter(status) } : {}),
    ...(trimmedSearch
      ? {
          OR: [
            { title: { contains: trimmedSearch, mode: 'insensitive' } },
            { filename: { contains: trimmedSearch, mode: 'insensitive' } },
            { originalName: { contains: trimmedSearch, mode: 'insensitive' } },
            { altText: { contains: trimmedSearch, mode: 'insensitive' } },
            { caption: { contains: trimmedSearch, mode: 'insensitive' } },
            { extension: { contains: trimmedSearch, mode: 'insensitive' } },
            { mimeType: { contains: trimmedSearch, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
};

export const createMediaAssetRecord = async (input: CreateMediaAssetInput) => {
  const storedValue = normalizeStoredMediaValue(input.publicUrl ?? input.url ?? input.path ?? input.storageKey ?? null);
  const extension = input.extension?.trim().toLowerCase().replace(/^\./, '')
    || getFileExtension(input.originalName)
    || getFileExtension(input.filename)
    || getFileExtension(storedValue)
    || null;
  const fileType = input.fileType ?? detectMediaKind(input.mimeType, extension ?? storedValue);

  return prisma.mediaAsset.create({
    data: {
      title: input.title ?? null,
      altText: input.altText ?? null,
      caption: input.caption ?? null,
      filename: input.filename,
      originalName: input.originalName ?? null,
      path: input.path ?? null,
      url: input.url ?? storedValue,
      publicUrl: input.publicUrl ?? storedValue,
      storageKey: input.storageKey ?? null,
      mimeType: input.mimeType ?? null,
      extension,
      fileType,
      size: input.size ?? null,
      width: input.width ?? null,
      height: input.height ?? null,
      duration: input.duration ?? null,
      status: input.status ?? SimpleStatus.ACTIVE,
    },
    select: mediaAssetSelect,
  });
};

export const listMediaItems = async (input: ListMediaInput) => {
  const [mediaAssets, legacyGalleryItems] = await Promise.all([
    prisma.mediaAsset.findMany({
      where: buildMediaAssetWhere(input),
      select: mediaAssetSelect,
    }),
    prisma.galleryItem.findMany({
      where: input.status === 'all'
        ? undefined
        : { status: input.status },
    }),
  ]);

  const normalizedSearch = input.search.trim().toLowerCase();
  const mappedItems = [
    ...mediaAssets.map(mapMediaAssetToListItem),
    ...legacyGalleryItems.map(mapLegacyGalleryItemToListItem),
  ].filter((item) => input.type === 'all' || item.kind === input.type)
    .filter((item) => (normalizedSearch ? getSearchHaystack(item).includes(normalizedSearch) : true));

  const sortedItems = sortMediaItems(mappedItems, input.sort);
  const total = sortedItems.length;
  const totalPages = Math.max(1, Math.ceil(total / input.pageSize));
  const startIndex = (input.page - 1) * input.pageSize;
  const items = sortedItems.slice(startIndex, startIndex + input.pageSize);

  return {
    items,
    page: input.page,
    pageSize: input.pageSize,
    total,
    totalPages,
    hasMore: startIndex + input.pageSize < total,
  };
};

export const updateMediaAssetMetadata = async (id: string, input: UpsertMediaMetadataInput) => {
  const existingItem = await prisma.mediaAsset.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingItem) {
    throw new ApiError(404, 'Media item not found.');
  }

  return prisma.mediaAsset.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.altText !== undefined ? { altText: input.altText } : {}),
      ...(input.caption !== undefined ? { caption: input.caption } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
    select: mediaAssetSelect,
  });
};

export const deleteMediaAsset = async (id: string) => {
  const existingItem = await prisma.mediaAsset.findUnique({
    where: { id },
    select: {
      id: true,
      storageKey: true,
      publicUrl: true,
    },
  });

  if (!existingItem) {
    throw new ApiError(404, 'Media item not found.');
  }

  const normalizedStoredValue = normalizeStoredMediaValue(existingItem.publicUrl);
  const relativeUploadPath = existingItem.storageKey
    || (normalizedStoredValue?.startsWith('/uploads/')
      ? normalizedStoredValue.replace(/^\/uploads\//, '')
      : null);

  if (relativeUploadPath) {
    await storageAdapter.delete(relativeUploadPath);
  }

  await prisma.mediaAsset.delete({
    where: { id },
  });
};

export const buildUploadedMediaTitle = (originalName: string) => {
  const basename = path.basename(originalName, path.extname(originalName));
  return basename.trim() || 'Uploaded media';
};
