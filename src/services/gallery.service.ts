import { GalleryItemType, Prisma, SimpleStatus } from '@prisma/client';

import { prisma } from '../config/prisma';
import { ApiError } from '../utils/api-error';
import { publicGalleryItemSelect, serializeGalleryItem } from '../utils/gallery-response';
import { publicMediaAssetSelect, resolveMediaAssetUrl } from '../utils/media-asset-response';

type CreateGalleryItemInput = {
  mediaAssetId?: string | null;
  title?: string | null;
  type: GalleryItemType;
  url?: string | null;
  thumbnail?: string | null;
  category?: string;
  altText?: string;
  seoTitle?: string;
  seoDescription?: string;
  sortOrder: number;
  status: SimpleStatus;
};

type UpdateGalleryItemInput = Partial<CreateGalleryItemInput>;

const normalizeNullableString = (value?: string | null) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

const normalizeRequiredTitle = (value?: string | null) => {
  const normalized = normalizeNullableString(value);
  return normalized ?? undefined;
};

const deriveTitleFromFilename = (value?: string | null) => {
  const normalized = normalizeNullableString(value);

  if (!normalized) {
    return null;
  }

  const withoutExtension = normalized.replace(/\.[a-z0-9]+$/i, '');
  const humanized = withoutExtension
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return humanized || null;
};

const resolveMediaAssetTitle = (
  asset?: {
    title: string | null;
    originalName: string | null;
    filename: string;
  } | null,
) =>
  normalizeNullableString(asset?.title)
  ?? deriveTitleFromFilename(asset?.originalName)
  ?? deriveTitleFromFilename(asset?.filename);

const getMediaAssetById = async (mediaAssetId?: string | null) => {
  const normalizedMediaAssetId = normalizeNullableString(mediaAssetId);

  if (!normalizedMediaAssetId) {
    return null;
  }

  const mediaAsset = await prisma.mediaAsset.findUnique({
    where: { id: normalizedMediaAssetId },
    select: publicMediaAssetSelect,
  });

  if (!mediaAsset) {
    throw new ApiError(400, 'Selected media library asset was not found.');
  }

  return mediaAsset;
};

const buildGalleryItemData = ({
  input,
  mediaAsset,
  existingItem,
}: {
  input: CreateGalleryItemInput | UpdateGalleryItemInput;
  mediaAsset?: Awaited<ReturnType<typeof getMediaAssetById>>;
  existingItem?: {
    title: string;
    type: GalleryItemType;
    url: string;
    thumbnail: string | null;
    mediaAssetId: string | null;
  } | null;
}): Prisma.GalleryItemUncheckedCreateInput | Prisma.GalleryItemUncheckedUpdateInput => {
  const data:
    | Prisma.GalleryItemUncheckedCreateInput
    | Prisma.GalleryItemUncheckedUpdateInput = {};

  const nextType =
    ('type' in input && input.type !== undefined ? input.type : existingItem?.type)
    ?? GalleryItemType.IMAGE;
  const nextMediaAssetId =
    ('mediaAssetId' in input ? normalizeNullableString(input.mediaAssetId) : undefined)
    ?? existingItem?.mediaAssetId
    ?? null;
  const assetUrl = resolveMediaAssetUrl(mediaAsset);
  const explicitUrl = normalizeNullableString(input.url);
  const explicitThumbnail = normalizeNullableString(input.thumbnail);
  const nextUrl = nextType === GalleryItemType.IMAGE
    ? explicitUrl ?? assetUrl ?? normalizeNullableString(existingItem?.url) ?? ''
    : explicitUrl ?? normalizeNullableString(existingItem?.url) ?? '';
  const nextThumbnail = nextType === GalleryItemType.IMAGE
    ? assetUrl ?? explicitThumbnail ?? explicitUrl ?? normalizeNullableString(existingItem?.thumbnail) ?? null
    : explicitThumbnail ?? normalizeNullableString(existingItem?.thumbnail) ?? null;
  const resolvedTitle =
    normalizeRequiredTitle(input.title)
    ?? resolveMediaAssetTitle(mediaAsset)
    ?? existingItem?.title;

  if ('mediaAssetId' in input) {
    data.mediaAssetId = nextMediaAssetId;
  }

  if ('title' in input || mediaAsset) {
    if (!resolvedTitle) {
      throw new ApiError(400, 'Gallery title is required.');
    }

    data.title = resolvedTitle;
  }

  if ('type' in input && input.type !== undefined) {
    data.type = input.type;
  }

  if ('url' in input || mediaAsset) {
    if (nextType === GalleryItemType.IMAGE) {
      if (!nextUrl) {
        throw new ApiError(400, 'Select an uploaded media library image or provide a legacy image URL.');
      }
    } else if (!nextUrl) {
      throw new ApiError(400, 'Video URL is required for gallery video items.');
    }

    data.url = nextUrl;
  }

  if ('thumbnail' in input || mediaAsset) {
    data.thumbnail = nextThumbnail;
  }

  if ('category' in input) {
    data.category = normalizeNullableString(input.category);
  }

  if ('altText' in input) {
    data.altText = normalizeNullableString(input.altText);
  }

  if ('seoTitle' in input) {
    data.seoTitle = normalizeNullableString(input.seoTitle);
  }

  if ('seoDescription' in input) {
    data.seoDescription = normalizeNullableString(input.seoDescription);
  }

  if ('sortOrder' in input && input.sortOrder !== undefined) {
    data.sortOrder = input.sortOrder;
  }

  if ('status' in input && input.status !== undefined) {
    data.status = input.status;
  }

  return data;
};

export const listGalleryItems = async (includeInactive = false) => {
  const items = await prisma.galleryItem.findMany({
    where: includeInactive ? undefined : { status: SimpleStatus.ACTIVE },
    select: publicGalleryItemSelect,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });

  return items.map((item) => serializeGalleryItem(item));
};

export const listHomepageGalleryItems = async () => {
  const items = await prisma.galleryItem.findMany({
    where: {
      status: SimpleStatus.ACTIVE,
      type: GalleryItemType.IMAGE,
    },
    select: publicGalleryItemSelect,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    take: 7,
  });

  return items.map((item) => serializeGalleryItem(item));
};

export const createGalleryItem = async (input: CreateGalleryItemInput) => {
  const mediaAsset = await getMediaAssetById(input.mediaAssetId);
  const createdItem = await prisma.galleryItem.create({
    data: buildGalleryItemData({ input, mediaAsset }) as Prisma.GalleryItemUncheckedCreateInput,
    select: publicGalleryItemSelect,
  });

  return serializeGalleryItem(createdItem);
};

export const updateGalleryItem = async (id: string, input: UpdateGalleryItemInput) => {
  const existingGalleryItem = await prisma.galleryItem.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      type: true,
      url: true,
      thumbnail: true,
      mediaAssetId: true,
    },
  });

  if (!existingGalleryItem) {
    throw new ApiError(404, 'Gallery item not found.');
  }

  const mediaAsset = await getMediaAssetById(
    'mediaAssetId' in input ? input.mediaAssetId : existingGalleryItem.mediaAssetId,
  );
  const updatedItem = await prisma.galleryItem.update({
    where: { id },
    data: buildGalleryItemData({
      input,
      mediaAsset,
      existingItem: existingGalleryItem,
    }) as Prisma.GalleryItemUncheckedUpdateInput,
    select: publicGalleryItemSelect,
  });

  return serializeGalleryItem(updatedItem);
};

export const deleteGalleryItem = async (id: string) => {
  const existingGalleryItem = await prisma.galleryItem.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingGalleryItem) {
    throw new ApiError(404, 'Gallery item not found.');
  }

  await prisma.galleryItem.delete({
    where: { id },
  });
};
